import { expect } from "chai";
import request from "supertest";
import app from "../src/app.js";
import UserModel from "../src/models/user.model.js";
import OrderModel from "../src/models/order.model.js";
import DeliveryModel from "../src/models/delivery.model.js";
import { usersRepository } from "../src/repositories/users.repository.js";
import { ERROR_DICTIONARY } from "../src/errors/errorDictionary.js";
import { USER_ROLES, ORDER_STATUS, DELIVERY_PRIORITY, DELIVERY_STATUS } from "../src/constants/index.js";
import { createUser, expectSuccess, expectError } from "./helpers.js";


const MOCK_ENDPOINTS = ["users", "drivers", "orders", "deliveries"];
const INVALID_QUANTITIES = ["abc", "-5", "0", "500", "2.5"];

describe("Mocks API", () => {

    
    // GET: datos simulados que NO se guardan en la base
   
    describe("GET /api/mocks/* (datos simulados sin guardar)", () => {

        MOCK_ENDPOINTS.forEach((entity) => {
            it(`/${entity}: devuelve 10 elementos por defecto`, async () => {
                const res = await request(app).get(`/api/mocks/${entity}`);

                expectSuccess(res, 200);
                expect(res.body.payload).to.be.an("array").with.lengthOf(10);
            });

            it(`/${entity}: respeta qty=3`, async () => {
                const res = await request(app).get(`/api/mocks/${entity}`).query({ qty: 3 });

                expectSuccess(res, 200);
                expect(res.body.payload).to.have.lengthOf(3);
            });

            INVALID_QUANTITIES.forEach((qty) => {
                it(`/${entity}: responde 400 INVALID_MOCK_AMOUNT con qty=${qty}`, async () => {
                    const res = await request(app).get(`/api/mocks/${entity}`).query({ qty });

                    expectError(res, 400, "INVALID_MOCK_AMOUNT");
                });
            });
        });

        it("/users: genera usuarios CUSTOMER con la estructura del modelo y emails únicos", async () => {
            const res = await request(app).get("/api/mocks/users").query({ qty: 20 });

            res.body.payload.forEach((user) => {
                expect(user).to.include.keys("firstName", "lastName", "email", "password", "role");
                expect(user.role).to.equal(USER_ROLES.CUSTOMER);
            });
            const emails = res.body.payload.map((user) => user.email);
            expect(new Set(emails).size).to.equal(emails.length);
        });

        it("/drivers: genera repartidores con rol DRIVER y el flag isAvailable", async () => {
            const res = await request(app).get("/api/mocks/drivers");

            res.body.payload.forEach((driver) => {
                expect(driver.role).to.equal(USER_ROLES.DRIVER);
                expect(driver.isAvailable).to.be.a("boolean");
            });
        });

        it("/orders: genera pedidos con estado y prioridad válidos y el total bien calculado", async () => {
            const res = await request(app).get("/api/mocks/orders").query({ qty: 20 });

            res.body.payload.forEach((order) => {
                expect(order).to.include.keys("customer", "items", "deliveryAddress", "total", "status", "priority");
                expect(Object.values(ORDER_STATUS)).to.include(order.status);
                expect(Object.values(DELIVERY_PRIORITY)).to.include(order.priority);
                expect(order.items).to.be.an("array").that.is.not.empty;

                const expectedTotal = order.items.reduce((sum, item) => sum + item.quantity * item.price, 0);
                expect(order.total).to.equal(expectedTotal);
            });
        });

        it("/deliveries: genera entregas con estado válido", async () => {
            const res = await request(app).get("/api/mocks/deliveries").query({ qty: 20 });

            res.body.payload.forEach((delivery) => {
                expect(delivery).to.include.keys("order", "driver", "status");
                expect(Object.values(DELIVERY_STATUS)).to.include(delivery.status);
            });
        });

        it("no guarda nada en la base de datos", async () => {
            for (const entity of MOCK_ENDPOINTS) {
                await request(app).get(`/api/mocks/${entity}`);
            }

            expect(await UserModel.countDocuments()).to.equal(0);
            expect(await OrderModel.countDocuments()).to.equal(0);
            expect(await DeliveryModel.countDocuments()).to.equal(0);
        });
    });

    
    // POST /seed: datos simulados que SÍ se guardan
    
    describe("POST /api/mocks/seed (inserta datos de prueba)", () => {

        it("sin parámetros inserta 10 usuarios CUSTOMER con password hasheado", async () => {
            const res = await request(app).post("/api/mocks/seed");

            expectSuccess(res, 201);
            expect(res.body.payload).to.deep.equal({ insertados: 10, coleccion: "usuarios" });

            const users = await UserModel.find();
            expect(users).to.have.lengthOf(10);
            users.forEach((user) => {
                expect(user.role).to.equal("CUSTOMER");
                expect(user.password).to.match(/^\$2[aby]\$/);
            });
        });

        it("entity=drivers inserta repartidores con rol DRIVER", async () => {
            const res = await request(app).post("/api/mocks/seed").query({ qty: 3, entity: "drivers" });

            expectSuccess(res, 201);
            expect(res.body.payload).to.deep.equal({ insertados: 3, coleccion: "repartidores" });
            expect(await UserModel.countDocuments({ role: "DRIVER" })).to.equal(3);
        });

        it("entity=orders sin usuarios: genera clientes en cascada y cada pedido apunta a un cliente real", async () => {
            const res = await request(app).post("/api/mocks/seed").query({ qty: 4, entity: "orders" });

            expectSuccess(res, 201);
            expect(res.body.payload).to.deep.equal({ insertados: 4, coleccion: "pedidos" });

            const customers = await UserModel.find({ role: "CUSTOMER" });
            const customerIds = customers.map((customer) => customer._id.toString());
            expect(customers).to.not.be.empty;

            const orders = await OrderModel.find();
            expect(orders).to.have.lengthOf(4);
            orders.forEach((order) => expect(customerIds).to.include(order.customer.toString()));
        });

        it("entity=orders con clientes ya existentes: los reutiliza y no crea clientes de más", async () => {
            await createUser();
            await createUser();

            await request(app).post("/api/mocks/seed").query({ qty: 3, entity: "orders" });

            expect(await UserModel.countDocuments()).to.equal(2);
            expect(await OrderModel.countDocuments()).to.equal(3);
        });

        it("entity=deliveries sin datos previos: genera pedidos y repartidores en cascada, con relaciones reales", async () => {
            const res = await request(app).post("/api/mocks/seed").query({ qty: 5, entity: "deliveries" });

            expectSuccess(res, 201);
            expect(res.body.payload).to.deep.equal({ insertados: 5, coleccion: "entregas" });

            const orderIds = (await OrderModel.find()).map((order) => order._id.toString());
            const drivers = await UserModel.find({ role: "DRIVER" });
            const driverIds = drivers.map((driver) => driver._id.toString());
            expect(orderIds).to.not.be.empty;
            expect(driverIds).to.not.be.empty;

            const deliveries = await DeliveryModel.find();
            expect(deliveries).to.have.lengthOf(5);
            deliveries.forEach((delivery) => {
                expect(orderIds).to.include(delivery.order.toString());
                if (delivery.driver) {
                    expect(driverIds).to.include(delivery.driver.toString());
                }
            });
        });

        it("responde 400 INVALID_MOCK_ENTITY si entity no es válida, y no inserta nada", async () => {
            const res = await request(app).post("/api/mocks/seed").query({ qty: 5, entity: "vehiculos" });

            expectError(res, 400, "INVALID_MOCK_ENTITY");
            expect(res.body.details).to.include("users, drivers, orders, deliveries");
            expect(await UserModel.countDocuments()).to.equal(0);
        });

        ["abc", "-5", "0", "101"].forEach((qty) => {
            it(`responde 400 INVALID_MOCK_AMOUNT con qty=${qty}, y no inserta nada`, async () => {
                const res = await request(app).post("/api/mocks/seed").query({ qty });

                expectError(res, 400, "INVALID_MOCK_AMOUNT");
                expect(await UserModel.countDocuments()).to.equal(0);
            });
        });

        it("responde 500 MOCK_GENERATION_ERROR si falla la inserción, sin filtrar el error técnico de la base", async () => {
            const originalInsertMany = usersRepository.insertMany;
            usersRepository.insertMany = async () => {
                throw new Error("E11000 duplicate key error collection: shipnow.users index: email_1");
            };

            try {
                const res = await request(app).post("/api/mocks/seed").query({ qty: 3 });

                expectError(res, 500, "MOCK_GENERATION_ERROR");
                expect(res.body.message).to.equal(ERROR_DICTIONARY.MOCK_GENERATION_ERROR.message);
                expect(res.body).to.not.have.property("details");
                expect(JSON.stringify(res.body)).to.not.include("E11000");
            } finally {
                usersRepository.insertMany = originalInsertMany;
            }
        });
    });
});