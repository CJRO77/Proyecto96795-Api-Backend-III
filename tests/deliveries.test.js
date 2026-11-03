import { expect } from "chai";
import request from "supertest";
import app from "../src/app.js";
import DeliveryModel from "../src/models/delivery.model.js";
import { DELIVERY_STATUS } from "../src/constants/index.js";
import {
    createUser, createDriver, createOrder, createDelivery,
    expectSuccess, expectError, NON_EXISTENT_ID, INVALID_ID
} from "./helpers.js";

describe("Deliveries API", () => {

    describe("GET /api/deliveries", () => {
        it("devuelve un arreglo vacío si no hay entregas", async () => {
            const res = await request(app).get("/api/deliveries");

            expectSuccess(res, 200);
            expect(res.body.payload).to.be.an("array").that.is.empty;
        });

        it("lista las entregas existentes con su estructura completa", async () => {
            await createDelivery();
            await createDelivery();

            const res = await request(app).get("/api/deliveries");

            expectSuccess(res, 200);
            expect(res.body.payload).to.have.lengthOf(2);
            res.body.payload.forEach((delivery) => {
                expect(delivery).to.include.keys("_id", "order", "driver", "status");
                expect(delivery).to.not.have.property("__v");
            });
        });

        it("filtra las entregas por estado", async () => {
            await createDelivery({ status: DELIVERY_STATUS.PENDING });
            await createDelivery({ status: DELIVERY_STATUS.DELIVERED });

            const res = await request(app).get("/api/deliveries").query({ status: "PENDING" });

            expectSuccess(res, 200);
            expect(res.body.payload).to.have.lengthOf(1);
            expect(res.body.payload[0].status).to.equal("PENDING");
        });

        it("responde 400 INVALID_DELIVERY_STATUS si el estado del filtro no es válido", async () => {
            const res = await request(app).get("/api/deliveries").query({ status: "en camino" });

            expectError(res, 400, "INVALID_DELIVERY_STATUS");
            expect(res.body.details).to.include("PENDING");
        });
    });

    describe("POST /api/deliveries", () => {
        it("crea una entrega sin repartidor: nace PENDING y con driver null", async () => {
            const order = await createOrder();

            const res = await request(app).post("/api/deliveries").send({ order: order._id.toString() });

            expectSuccess(res, 201);
            expect(res.body.message).to.equal("Entrega creada correctamente");
            expect(res.body.payload).to.have.property("_id");
            expect(res.body.payload.order).to.equal(order._id.toString());
            expect(res.body.payload.driver).to.equal(null);
            expect(res.body.payload.status).to.equal("PENDING");
            expect(res.body.payload).to.not.have.property("__v");
        });

        it("crea una entrega con un repartidor disponible: nace ASSIGNED", async () => {
            const order = await createOrder();
            const driver = await createDriver({ isAvailable: true });

            const res = await request(app)
                .post("/api/deliveries")
                .send({ order: order._id.toString(), driver: driver._id.toString() });

            expectSuccess(res, 201);
            expect(res.body.payload.driver).to.equal(driver._id.toString());
            expect(res.body.payload.status).to.equal("ASSIGNED");
            expect(await DeliveryModel.countDocuments()).to.equal(1);
        });

        it("responde 400 VALIDATION_ERROR si falta el campo order", async () => {
            const driver = await createDriver();

            const res = await request(app).post("/api/deliveries").send({ driver: driver._id.toString() });

            expectError(res, 400, "VALIDATION_ERROR");
            expect(res.body.details).to.include("order");
        });

        it("responde 400 VALIDATION_ERROR si no se envía body", async () => {
            const res = await request(app).post("/api/deliveries");

            expectError(res, 400, "VALIDATION_ERROR");
        });

        it("responde 400 INVALID_ID si el id del pedido no tiene formato de ObjectId", async () => {
            const res = await request(app).post("/api/deliveries").send({ order: INVALID_ID });

            expectError(res, 400, "INVALID_ID");
        });

        it("responde 404 ORDER_NOT_FOUND si el pedido no existe", async () => {
            const res = await request(app).post("/api/deliveries").send({ order: NON_EXISTENT_ID });

            expectError(res, 404, "ORDER_NOT_FOUND");
            expect(await DeliveryModel.countDocuments()).to.equal(0);
        });

        it("responde 404 USER_NOT_FOUND si el repartidor no existe", async () => {
            const order = await createOrder();

            const res = await request(app)
                .post("/api/deliveries")
                .send({ order: order._id.toString(), driver: NON_EXISTENT_ID });

            expectError(res, 404, "USER_NOT_FOUND");
        });

        it("responde 400 INVALID_USER_ROLE si el usuario indicado como driver no es DRIVER", async () => {
            const order = await createOrder();
            const customer = await createUser(); // rol CUSTOMER

            const res = await request(app)
                .post("/api/deliveries")
                .send({ order: order._id.toString(), driver: customer._id.toString() });

            expectError(res, 400, "INVALID_USER_ROLE");
            expect(res.body.details).to.include("CUSTOMER");
            expect(await DeliveryModel.countDocuments()).to.equal(0);
        });

        it("responde 409 DRIVER_NOT_AVAILABLE si el repartidor no está disponible, y no crea la entrega", async () => {
            const order = await createOrder();
            const busyDriver = await createDriver({ isAvailable: false });

            const res = await request(app)
                .post("/api/deliveries")
                .send({ order: order._id.toString(), driver: busyDriver._id.toString() });

            expectError(res, 409, "DRIVER_NOT_AVAILABLE");
            expect(await DeliveryModel.countDocuments()).to.equal(0);
        });
    });

    describe("GET /api/deliveries/:id", () => {
        it("devuelve la entrega pedida", async () => {
            const delivery = await createDelivery();

            const res = await request(app).get(`/api/deliveries/${delivery._id}`);

            expectSuccess(res, 200);
            expect(res.body.payload).to.include({ _id: delivery._id.toString(), status: "PENDING" });
        });

        it("responde 400 INVALID_ID si el id no tiene formato de ObjectId", async () => {
            const res = await request(app).get(`/api/deliveries/${INVALID_ID}`);

            expectError(res, 400, "INVALID_ID");
        });

        it("responde 404 DELIVERY_NOT_FOUND si la entrega no existe", async () => {
            const res = await request(app).get(`/api/deliveries/${NON_EXISTENT_ID}`);

            expectError(res, 404, "DELIVERY_NOT_FOUND");
        });
    });

    describe("PATCH /api/deliveries/:id/status", () => {
        it("actualiza el estado de la entrega", async () => {
            const delivery = await createDelivery();

            const res = await request(app).patch(`/api/deliveries/${delivery._id}/status`).send({ status: "DELIVERED" });

            expectSuccess(res, 200);
            expect(res.body.message).to.equal("Estado de la entrega actualizado correctamente");
            expect(res.body.payload.status).to.equal("DELIVERED");
            expect((await DeliveryModel.findById(delivery._id)).status).to.equal("DELIVERED");
        });

        it("responde 400 INVALID_DELIVERY_STATUS si el estado no es válido y no modifica la entrega", async () => {
            const delivery = await createDelivery();

            const res = await request(app).patch(`/api/deliveries/${delivery._id}/status`).send({ status: "en camino" });

            expectError(res, 400, "INVALID_DELIVERY_STATUS");
            expect((await DeliveryModel.findById(delivery._id)).status).to.equal("PENDING");
        });

        it("responde 400 INVALID_ID si el id no tiene formato de ObjectId", async () => {
            const res = await request(app).patch(`/api/deliveries/${INVALID_ID}/status`).send({ status: "DELIVERED" });

            expectError(res, 400, "INVALID_ID");
        });

        it("responde 404 DELIVERY_NOT_FOUND si la entrega no existe", async () => {
            const res = await request(app).patch(`/api/deliveries/${NON_EXISTENT_ID}/status`).send({ status: "DELIVERED" });

            expectError(res, 404, "DELIVERY_NOT_FOUND");
        });
    });
});