
import { describe, it } from "mocha";
import { expect } from "chai";
import request from "supertest";
import app from "../src/app.js";

// Pruebas generales de la API, que no encajan en un recurso específico.

describe("Pruebas generales de ShipNow API", function () {

    it("debe responder correctamente en la documentación de Swagger", async function () {
        const response = await request(app)
            .get("/api/docs/");

        expect(response.status).to.equal(200);
        expect(response.text).to.be.a("string");
        expect(response.text).to.include("swagger-ui");
    });

    it("debe generar una respuesta exitosa en el endpoint del logger", async function () {
        const response = await request(app)
            .get("/api/logger-test");

        expect(response.status).to.equal(200);
        expect(response.body.status).to.equal("success");
        expect(response.body.payload).to.have.property("message");
        expect(response.body.payload.message)
            .to.equal("Logs generados correctamente en los 6 niveles");
    });

    it("debe devolver un error 404 para una ruta inexistente", async function () {
        const response = await request(app)
            .get("/api/ruta-que-no-existe");

        expect(response.status).to.equal(404);
        expect(response.body.status).to.equal("error");
        expect(response.body.error).to.equal("ROUTE_NOT_FOUND");
        expect(response.body.message)
            .to.equal("La ruta solicitada no existe");
    });

    it("debe generar usuarios simulados en la cantidad solicitada", async function () {
        const response = await request(app)
            .get("/api/mocks/users?qty=3");

        expect(response.status).to.equal(200);
        expect(response.body.status).to.equal("success");
        expect(response.body.payload).to.be.an("array");
        expect(response.body.payload).to.have.lengthOf(3);
    });

    it("debe generar repartidores simulados en la cantidad solicitada", async function () {
        const response = await request(app)
            .get("/api/mocks/drivers?qty=2");

        expect(response.status).to.equal(200);
        expect(response.body.status).to.equal("success");
        expect(response.body.payload).to.be.an("array");
        expect(response.body.payload).to.have.lengthOf(2);
    });

    it("debe generar pedidos simulados en la cantidad solicitada", async function () {
        const response = await request(app)
            .get("/api/mocks/orders?qty=4");

        expect(response.status).to.equal(200);
        expect(response.body.status).to.equal("success");
        expect(response.body.payload).to.be.an("array");
        expect(response.body.payload).to.have.lengthOf(4);
    });

    it("debe generar entregas simuladas en la cantidad solicitada", async function () {
        const response = await request(app)
            .get("/api/mocks/deliveries?qty=2");

        expect(response.status).to.equal(200);
        expect(response.body.status).to.equal("success");
        expect(response.body.payload).to.be.an("array");
        expect(response.body.payload).to.have.lengthOf(2);
    });

    
    it("debe rechazar una cantidad que no sea numérica", async function () {
        const response = await request(app)
            .get("/api/mocks/users?qty=abc");

        expect(response.status).to.equal(400);
        expect(response.body.status).to.equal("error");
        expect(response.body.error).to.equal("INVALID_MOCK_AMOUNT");
        expect(response.body.message)
            .to.equal("La cantidad de registros a generar debe ser un número entero positivo");
    });

    it("debe rechazar una cantidad igual a cero", async function () {
        const response = await request(app)
            .get("/api/mocks/users?qty=0");

        expect(response.status).to.equal(400);
        expect(response.body.status).to.equal("error");
        expect(response.body.error).to.equal("INVALID_MOCK_AMOUNT");
    });

    it("debe rechazar una cantidad superior al límite permitido", async function () {
        const response = await request(app)
            .get("/api/mocks/users?qty=101");

        expect(response.status).to.equal(400);
        expect(response.body.status).to.equal("error");
        expect(response.body.error).to.equal("INVALID_MOCK_AMOUNT");
    });


});
