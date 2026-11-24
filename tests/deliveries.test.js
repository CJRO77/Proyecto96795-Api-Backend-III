import { expect } from "chai";
import request from "supertest";
import app from "../src/app.js";
import DeliveryModel from "../src/models/delivery.model.js";
import { DELIVERY_STATUS } from "../src/constants/index.js";
import {
  createUser,
  createDriver,
  createOrder,
  createDelivery,
  expectSuccess,
  expectError,
  NON_EXISTENT_ID,
  INVALID_ID,
} from "./helpers.js";

describe("Deliveries API", () => {
  // GET: listado de entregas y paginación.

  describe("GET /api/deliveries", function () {
    this.timeout(10000);
    it("devuelve un array vacío cuando no hay entregas", async () => {
      const res = await request(app).get("/api/deliveries");

      expectSuccess(res, 200);
      expect(res.body.payload).to.be.an("array").that.is.empty;
    });

    it("devuelve las entregas existentes", async () => {
      const delivery = await createDelivery();

      const res = await request(app).get("/api/deliveries");

      expectSuccess(res, 200);
      expect(res.body.payload).to.be.an("array").with.lengthOf(1);
      expect(res.body.payload[0]._id).to.equal(delivery._id.toString());
    });

    it("filtra las entregas por estado", async () => {
      const pendingDelivery = await createDelivery();
      const assignedDelivery = await createDelivery();

      await DeliveryModel.findByIdAndUpdate(assignedDelivery._id, {
        status: DELIVERY_STATUS.ASSIGNED,
      });

      const res = await request(app).get(
        `/api/deliveries?status=${DELIVERY_STATUS.PENDING}`,
      );

      expectSuccess(res, 200);
      expect(res.body.payload).to.have.lengthOf(1);
      expect(res.body.payload[0]._id).to.equal(pendingDelivery._id.toString());
      expect(res.body.payload[0].status).to.equal(DELIVERY_STATUS.PENDING);
    });

    it("responde 400 INVALID_DELIVERY_STATUS si el estado no es válido", async () => {
      const res = await request(app).get(
        "/api/deliveries?status=ESTADO_INVALIDO",
      );

      expectError(res, 400, "INVALID_DELIVERY_STATUS");
    });

    it("devuelve solamente las entregas correspondientes a la página solicitada", async () => {
      for (let i = 0; i < 12; i++) {
        await createDelivery();
      }

      const page1 = await request(app).get("/api/deliveries?page=1&limit=10");
      const page2 = await request(app).get("/api/deliveries?page=2&limit=10");

      expectSuccess(page1, 200);
      expectSuccess(page2, 200);

      expect(page1.body.payload).to.have.lengthOf(10);
      expect(page2.body.payload).to.have.lengthOf(2);

      const idsPage1 = page1.body.payload.map((delivery) => delivery._id);
      const idsPage2 = page2.body.payload.map((delivery) => delivery._id);

      expect(idsPage1).to.not.include.members(idsPage2);
    });

    it("devuelve los metadatos de paginación", async () => {
      for (let i = 0; i < 12; i++) {
        await createDelivery();
      }

      const res = await request(app).get("/api/deliveries?page=1&limit=10");

      expectSuccess(res, 200);
      expect(res.body.pagination).to.deep.equal({
        page: 1,
        limit: 10,
        totalPages: 2,
        totalDeliveries: 12,
      });
    });

    it("permite establecer una cantidad personalizada mediante limit", async function () {
      this.timeout(10000);
      for (let i = 0; i < 12; i++) {
        await createDelivery();
      }

      const res = await request(app).get("/api/deliveries?page=1&limit=5");

      expectSuccess(res, 200);
      expect(res.body.payload).to.have.lengthOf(5);
      expect(res.body.pagination.limit).to.equal(5);
      expect(res.body.pagination.totalPages).to.equal(3);
    });

    it("combina el filtro por estado con la paginación", async () => {
      const pendingDelivery = await createDelivery();

      const assignedDelivery = await createDelivery();
      await DeliveryModel.findByIdAndUpdate(assignedDelivery._id, {
        status: DELIVERY_STATUS.ASSIGNED,
      });

      const res = await request(app).get(
        `/api/deliveries?status=${DELIVERY_STATUS.PENDING}&page=1&limit=5`,
      );

      expectSuccess(res, 200);
      expect(res.body.payload).to.have.lengthOf(1);
      expect(res.body.payload[0]._id).to.equal(pendingDelivery._id.toString());
      expect(res.body.pagination.totalDeliveries).to.equal(1);
    });

    it("responde 400 VALIDATION_ERROR si page es 0", async () => {
      const res = await request(app).get("/api/deliveries?page=0");

      expectError(res, 400, "VALIDATION_ERROR");
    });

    it("responde 400 VALIDATION_ERROR si page no es un número", async () => {
      const res = await request(app).get("/api/deliveries?page=abc");

      expectError(res, 400, "VALIDATION_ERROR");
    });

    it("responde 400 VALIDATION_ERROR si limit es 0", async () => {
      const res = await request(app).get("/api/deliveries?limit=0");

      expectError(res, 400, "VALIDATION_ERROR");
    });

    it("responde 400 VALIDATION_ERROR si limit supera el máximo permitido", async () => {
      const res = await request(app).get("/api/deliveries?limit=101");

      expectError(res, 400, "VALIDATION_ERROR");
    });
  });

  // POST: creación de entregas.
  describe("POST /api/deliveries", () => {
    it("crea una entrega sin repartidor: nace PENDING y con driver null", async () => {
      const order = await createOrder();

      const res = await request(app)
        .post("/api/deliveries")
        .send({ order: order._id.toString() });

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

      const res = await request(app).post("/api/deliveries").send({
        order: order._id.toString(),
        driver: driver._id.toString(),
      });

      expectSuccess(res, 201);
      expect(res.body.payload.driver).to.equal(driver._id.toString());
      expect(res.body.payload.status).to.equal("ASSIGNED");
      expect(await DeliveryModel.countDocuments()).to.equal(1);
    });

    it("responde 400 VALIDATION_ERROR si falta el campo order", async () => {
      const driver = await createDriver();

      const res = await request(app)
        .post("/api/deliveries")
        .send({ driver: driver._id.toString() });

      expectError(res, 400, "VALIDATION_ERROR");
      expect(res.body.details).to.include("order");
    });

    it("responde 400 VALIDATION_ERROR si no se envía body", async () => {
      const res = await request(app).post("/api/deliveries");

      expectError(res, 400, "VALIDATION_ERROR");
    });

    it("responde 400 INVALID_ID si el id del pedido no tiene formato de ObjectId", async () => {
      const res = await request(app)
        .post("/api/deliveries")
        .send({ order: INVALID_ID });

      expectError(res, 400, "INVALID_ID");
    });

    it("responde 404 ORDER_NOT_FOUND si el pedido no existe", async () => {
      const res = await request(app)
        .post("/api/deliveries")
        .send({ order: NON_EXISTENT_ID });

      expectError(res, 404, "ORDER_NOT_FOUND");
      expect(await DeliveryModel.countDocuments()).to.equal(0);
    });

    it("responde 404 USER_NOT_FOUND si el repartidor no existe", async () => {
      const order = await createOrder();

      const res = await request(app).post("/api/deliveries").send({
        order: order._id.toString(),
        driver: NON_EXISTENT_ID,
      });

      expectError(res, 404, "USER_NOT_FOUND");
    });

    it("responde 400 INVALID_USER_ROLE si el usuario indicado como driver no es DRIVER", async () => {
      const order = await createOrder();
      const customer = await createUser();

      const res = await request(app).post("/api/deliveries").send({
        order: order._id.toString(),
        driver: customer._id.toString(),
      });

      expectError(res, 400, "INVALID_USER_ROLE");
      expect(res.body.details).to.include("CUSTOMER");
      expect(await DeliveryModel.countDocuments()).to.equal(0);
    });

    it("responde 409 DRIVER_NOT_AVAILABLE si el repartidor no está disponible", async () => {
      const order = await createOrder();
      const busyDriver = await createDriver({ isAvailable: false });

      const res = await request(app).post("/api/deliveries").send({
        order: order._id.toString(),
        driver: busyDriver._id.toString(),
      });

      expectError(res, 409, "DRIVER_NOT_AVAILABLE");
      expect(await DeliveryModel.countDocuments()).to.equal(0);
    });
  });

  // GET: búsqueda de una entrega por su ID.
  describe("GET /api/deliveries/:id", () => {
    it("devuelve la entrega pedida", async () => {
      const delivery = await createDelivery();

      const res = await request(app).get(`/api/deliveries/${delivery._id}`);

      expectSuccess(res, 200);
      expect(res.body.payload).to.include({
        _id: delivery._id.toString(),
        status: "PENDING",
      });
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

  // PATCH: actualización del estado de una entrega.
  describe("PATCH /api/deliveries/:id/status", () => {
    it("actualiza correctamente el estado de una entrega", async () => {
      const delivery = await createDelivery();

      const res = await request(app)
        .patch(`/api/deliveries/${delivery._id}/status`)
        .send({ status: DELIVERY_STATUS.IN_TRANSIT });

      expectSuccess(res, 200);
      expect(res.body.payload.status).to.equal(DELIVERY_STATUS.IN_TRANSIT);
    });

    it("responde 400 INVALID_DELIVERY_STATUS si el estado no es válido", async () => {
      const delivery = await createDelivery();

      const res = await request(app)
        .patch(`/api/deliveries/${delivery._id}/status`)
        .send({ status: "ESTADO_INVALIDO" });

      expectError(res, 400, "INVALID_DELIVERY_STATUS");
    });

    it("responde 400 INVALID_ID si el id no tiene formato de ObjectId", async () => {
      const res = await request(app)
        .patch(`/api/deliveries/${INVALID_ID}/status`)
        .send({ status: DELIVERY_STATUS.IN_TRANSIT });

      expectError(res, 400, "INVALID_ID");
    });

    it("responde 404 DELIVERY_NOT_FOUND si la entrega no existe", async () => {
      const res = await request(app)
        .patch(`/api/deliveries/${NON_EXISTENT_ID}/status`)
        .send({ status: DELIVERY_STATUS.IN_TRANSIT });

      expectError(res, 404, "DELIVERY_NOT_FOUND");
    });
  });
});
