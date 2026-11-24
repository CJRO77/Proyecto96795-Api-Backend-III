import { expect } from "chai";
import request from "supertest";
import app from "../src/app.js";
import OrderModel from "../src/models/order.model.js";
import { ORDER_STATUS } from "../src/constants/index.js";
import { createUser, createOrder, expectSuccess, expectError, NON_EXISTENT_ID, INVALID_ID } from "./helpers.js";

// Función para generar un body de pedido válido, con posibilidad de sobrescribir campos

const validOrderBody = (customerId, overrides = {}) => ({
    customer: customerId,
    deliveryAddress: "Av. Siempre Viva 742",
    items: [
        { name: "Paquete mediano", quantity: 2, price: 1500 },
        { name: "Sobre documentos", quantity: 1, price: 500 }
    ],
    ...overrides
});

describe("Orders API", () => {

    describe("GET /api/orders", () => {
        it("devuelve un arreglo vacío si no hay pedidos", async () => {
            const res = await request(app).get("/api/orders");

            expectSuccess(res, 200);
            expect(res.body.payload).to.be.an("array").that.is.empty;
        });

        it("lista los pedidos existentes con su estructura completa", async () => {
            await createOrder();
            await createOrder();

            const res = await request(app).get("/api/orders");

            expectSuccess(res, 200);
            expect(res.body.payload).to.have.lengthOf(2);

            res.body.payload.forEach((order) => {
                expect(order).to.include.keys("_id", "customer", "items", "deliveryAddress", "total", "status", "priority");
                expect(order.items).to.be.an("array").that.is.not.empty;
                expect(order).to.not.have.property("__v");
            });
        });

        it("filtra los pedidos por estado", async () => {
            await createOrder({ status: ORDER_STATUS.CREATED });
            await createOrder({ status: ORDER_STATUS.DELIVERED });
            await createOrder({ status: ORDER_STATUS.DELIVERED });

            const res = await request(app).get("/api/orders").query({ status: "DELIVERED" });

            expectSuccess(res, 200);
            expect(res.body.payload).to.have.lengthOf(2);
            res.body.payload.forEach((order) => expect(order.status).to.equal("DELIVERED"));
        });


        it("devuelve solamente los pedidos correspondientes a la página solicitada", async () => {
            const customer = await createUser();

            for (let i = 0; i < 12; i++) {
                await createOrder({ customer: customer._id });
            }

            const page1 = await request(app)
                .get("/api/orders")
                .query({ page: 1, limit: 10 });

            const page2 = await request(app)
                .get("/api/orders")
                .query({ page: 2, limit: 10 });

            expectSuccess(page1, 200);
            expectSuccess(page2, 200);

            expect(page1.body.payload).to.have.lengthOf(10);
            expect(page2.body.payload).to.have.lengthOf(2);

            const page1Ids = page1.body.payload.map(order => order._id);
            const page2Ids = page2.body.payload.map(order => order._id);

            expect(page1Ids).to.have.lengthOf(10);
            expect(page2Ids).to.have.lengthOf(2);

            page2Ids.forEach(id => {
                expect(page1Ids).to.not.include(id);
            });
        });

        it("devuelve los metadatos correctos de paginación", async () => {
            const customer = await createUser();

            for (let i = 0; i < 12; i++) {
                await createOrder({ customer: customer._id });
            }

            const res = await request(app)
                .get("/api/orders")
                .query({ page: 1, limit: 10 });

            expectSuccess(res, 200);
            expect(res.body.pagination).to.deep.equal({
                page: 1,
                limit: 10,
                totalPages: 2,
                totalOrders: 12
            });
        });

        it("permite personalizar la cantidad de pedidos por página", async () => {
            const customer = await createUser();

            for (let i = 0; i < 7; i++) {
                await createOrder({ customer: customer._id });
            }

            const res = await request(app)
                .get("/api/orders")
                .query({ page: 1, limit: 5 });

            expectSuccess(res, 200);
            expect(res.body.payload).to.have.lengthOf(5);
            expect(res.body.pagination.totalOrders).to.equal(7);
            expect(res.body.pagination.totalPages).to.equal(2);
        });

        it("combina correctamente el filtro por estado con la paginación", async () => {
            const customer = await createUser();

            for (let i = 0; i < 12; i++) {
                await createOrder({
                    customer: customer._id,
                    status: ORDER_STATUS.DELIVERED
                });
            }

            await createOrder({
                customer: customer._id,
                status: ORDER_STATUS.CREATED
            });

            const res = await request(app)
                .get("/api/orders")
                .query({ status: "DELIVERED", page: 1, limit: 10 });

            expectSuccess(res, 200);
            expect(res.body.payload).to.have.lengthOf(10);
            expect(res.body.pagination.totalOrders).to.equal(12);
            expect(res.body.pagination.totalPages).to.equal(2);

            res.body.payload.forEach(order => {
                expect(order.status).to.equal("DELIVERED");
            });
        });

        it("rechaza una página menor que 1", async () => {
            const res = await request(app)
                .get("/api/orders")
                .query({ page: 0 });

            expectError(res, 400, "VALIDATION_ERROR");
            expect(res.body.details).to.include("page");
        });

        it("rechaza una página que no sea un número entero", async () => {
            const res = await request(app)
                .get("/api/orders")
                .query({ page: "abc" });

            expectError(res, 400, "VALIDATION_ERROR");
            expect(res.body.details).to.include("page");
        });

        it("rechaza un límite menor que 1", async () => {
            const res = await request(app)
                .get("/api/orders")
                .query({ limit: 0 });

            expectError(res, 400, "VALIDATION_ERROR");
            expect(res.body.details).to.include("limit");
        });

        it("rechaza un límite mayor que 100", async () => {
            const res = await request(app)
                .get("/api/orders")
                .query({ limit: 101 });

            expectError(res, 400, "VALIDATION_ERROR");
            expect(res.body.details).to.include("100");
        });


        it("responde 400 INVALID_ORDER_STATUS si el estado del filtro no es válido", async () => {
            const res = await request(app).get("/api/orders").query({ status: "en camino" });

            expectError(res, 400, "INVALID_ORDER_STATUS");
            expect(res.body.details).to.include("CREATED");
        });
    });

    describe("POST /api/orders", () => {
        it("crea un pedido válido: calcula el total, nace CREATED y con prioridad NORMAL", async () => {
            const customer = await createUser();

            const res = await request(app).post("/api/orders").send(validOrderBody(customer._id.toString()));

            expectSuccess(res, 201);
            expect(res.body.message).to.equal("Pedido creado correctamente");
            expect(res.body.payload).to.have.property("_id");
            expect(res.body.payload.customer).to.equal(customer._id.toString());
            expect(res.body.payload.total).to.equal(3500); // (2 x 1500) + (1 x 500)
            expect(res.body.payload.status).to.equal("CREATED");
            expect(res.body.payload.priority).to.equal("NORMAL");
            expect(res.body.payload.items).to.have.lengthOf(2);
            expect(res.body.payload.items[0]).to.deep.equal({ name: "Paquete mediano", quantity: 2, price: 1500 });
            expect(res.body.payload).to.not.have.property("__v");
        });

        it("guarda el pedido en la base de datos", async () => {
            const customer = await createUser();

            const res = await request(app).post("/api/orders").send(validOrderBody(customer._id.toString()));

            const stored = await OrderModel.findById(res.body.payload._id);
            expect(stored).to.not.equal(null);
            expect(stored.total).to.equal(3500);
        });

        it("ignora un total enviado por el cliente: lo calcula siempre el servidor", async () => {
            const customer = await createUser();

            const res = await request(app).post("/api/orders").send(validOrderBody(customer._id.toString(), { total: 1 }));

            expectSuccess(res, 201);
            expect(res.body.payload.total).to.equal(3500);
        });

        it("respeta la prioridad enviada", async () => {
            const customer = await createUser();

            const res = await request(app).post("/api/orders").send(validOrderBody(customer._id.toString(), { priority: "HIGH" }));

            expectSuccess(res, 201);
            expect(res.body.payload.priority).to.equal("HIGH");
        });

        it("responde 400 ORDER_ITEMS_REQUIRED si el pedido no tiene items", async () => {
            const customer = await createUser();

            const res = await request(app).post("/api/orders").send(validOrderBody(customer._id.toString(), { items: [] }));

            expectError(res, 400, "ORDER_ITEMS_REQUIRED");
            expect(await OrderModel.countDocuments()).to.equal(0);
        });

        it("responde 400 ORDER_ITEMS_REQUIRED si no se envía el campo items", async () => {
            const customer = await createUser();
            const { items, ...withoutItems } = validOrderBody(customer._id.toString());

            const res = await request(app).post("/api/orders").send(withoutItems);

            expectError(res, 400, "ORDER_ITEMS_REQUIRED");
        });

        it("responde 400 VALIDATION_ERROR si falta la dirección de entrega", async () => {
            const customer = await createUser();
            const { deliveryAddress, ...withoutAddress } = validOrderBody(customer._id.toString());

            const res = await request(app).post("/api/orders").send(withoutAddress);

            expectError(res, 400, "VALIDATION_ERROR");
            expect(res.body.details).to.include("deliveryAddress");
        });

        it("responde 400 VALIDATION_ERROR si falta el customer", async () => {
            const { customer, ...withoutCustomer } = validOrderBody("x");

            const res = await request(app).post("/api/orders").send(withoutCustomer);

            expectError(res, 400, "VALIDATION_ERROR");
        });

        it("responde 400 VALIDATION_ERROR si no se envía body", async () => {
            const res = await request(app).post("/api/orders");

            expectError(res, 400, "VALIDATION_ERROR");
        });

        it("responde 400 VALIDATION_ERROR si un item tiene cantidad inválida e indica cuál", async () => {
            const customer = await createUser();
            const items = [{ name: "Paquete", quantity: 0, price: 100 }];

            const res = await request(app).post("/api/orders").send(validOrderBody(customer._id.toString(), { items }));

            expectError(res, 400, "VALIDATION_ERROR");
            expect(res.body.details).to.include("items[0].quantity");
        });

        it("responde 400 VALIDATION_ERROR si un item tiene precio negativo", async () => {
            const customer = await createUser();
            const items = [{ name: "Paquete", quantity: 1, price: -100 }];

            const res = await request(app).post("/api/orders").send(validOrderBody(customer._id.toString(), { items }));

            expectError(res, 400, "VALIDATION_ERROR");
            expect(res.body.details).to.include("items[0].price");
        });

        it("responde 400 VALIDATION_ERROR si la prioridad no es válida", async () => {
            const customer = await createUser();

            const res = await request(app).post("/api/orders").send(validOrderBody(customer._id.toString(), { priority: "URGENTE" }));

            expectError(res, 400, "VALIDATION_ERROR");
            expect(res.body.details).to.include("priority");
        });

        it("responde 400 INVALID_ID si el customer no tiene formato de ObjectId", async () => {
            const res = await request(app).post("/api/orders").send(validOrderBody(INVALID_ID));

            expectError(res, 400, "INVALID_ID");
        });

        it("responde 404 USER_NOT_FOUND si el customer no existe, y no crea el pedido", async () => {
            const res = await request(app).post("/api/orders").send(validOrderBody(NON_EXISTENT_ID));

            expectError(res, 404, "USER_NOT_FOUND");
            expect(await OrderModel.countDocuments()).to.equal(0);
        });
    });

    describe("GET /api/orders/:id", () => {
        it("devuelve el pedido pedido", async () => {
            const order = await createOrder();

            const res = await request(app).get(`/api/orders/${order._id}`);

            expectSuccess(res, 200);
            expect(res.body.payload).to.include({ _id: order._id.toString(), total: 3000, status: "CREATED" });
            expect(res.body.payload.items).to.have.lengthOf(1);
        });

        it("responde 400 INVALID_ID si el id no tiene formato de ObjectId", async () => {
            const res = await request(app).get(`/api/orders/${INVALID_ID}`);

            expectError(res, 400, "INVALID_ID");
        });

        it("responde 404 ORDER_NOT_FOUND si el pedido no existe", async () => {
            const res = await request(app).get(`/api/orders/${NON_EXISTENT_ID}`);

            expectError(res, 404, "ORDER_NOT_FOUND");
        });
    });

    describe("PATCH /api/orders/:id/status", () => {
        it("actualiza el estado del pedido", async () => {
            const order = await createOrder();

            const res = await request(app).patch(`/api/orders/${order._id}/status`).send({ status: "IN_TRANSIT" });

            expectSuccess(res, 200);
            expect(res.body.message).to.equal("Estado del pedido actualizado correctamente");
            expect(res.body.payload.status).to.equal("IN_TRANSIT");
            expect((await OrderModel.findById(order._id)).status).to.equal("IN_TRANSIT");
        });

        it("responde 400 INVALID_ORDER_STATUS si el estado no es válido y no modifica el pedido", async () => {
            const order = await createOrder();

            const res = await request(app).patch(`/api/orders/${order._id}/status`).send({ status: "en camino" });

            expectError(res, 400, "INVALID_ORDER_STATUS");
            expect((await OrderModel.findById(order._id)).status).to.equal("CREATED");
        });

        it("responde 400 INVALID_ORDER_STATUS si no se envía el estado", async () => {
            const order = await createOrder();

            const res = await request(app).patch(`/api/orders/${order._id}/status`);

            expectError(res, 400, "INVALID_ORDER_STATUS");
        });

        it("responde 400 INVALID_ID si el id no tiene formato de ObjectId", async () => {
            const res = await request(app).patch(`/api/orders/${INVALID_ID}/status`).send({ status: "IN_TRANSIT" });

            expectError(res, 400, "INVALID_ID");
        });

        it("responde 404 ORDER_NOT_FOUND si el pedido no existe", async () => {
            const res = await request(app).patch(`/api/orders/${NON_EXISTENT_ID}/status`).send({ status: "IN_TRANSIT" });

            expectError(res, 404, "ORDER_NOT_FOUND");
        });

        it("responde 409 ORDER_ALREADY_DELIVERED si el pedido ya fue entregado, y no lo modifica", async () => {
            const order = await createOrder({ status: ORDER_STATUS.DELIVERED });

            const res = await request(app).patch(`/api/orders/${order._id}/status`).send({ status: "CANCELLED" });

            expectError(res, 409, "ORDER_ALREADY_DELIVERED");
            expect((await OrderModel.findById(order._id)).status).to.equal("DELIVERED");
        });
    });
});