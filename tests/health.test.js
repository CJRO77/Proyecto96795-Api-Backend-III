import { describe, it, beforeEach, afterEach } from "mocha";
import { expect } from "chai";
import request from "supertest";
import mongoose from "mongoose";
import { config } from "../src/config/env.config.js";
import app from "../src/app.js";

// Pruebas funcionales del endpoint de salud de ShipNow.

describe("Health - Estado de salud de la API", function () {

    let originalReadyState;

    // Guardamos el estado real de la conexión antes de cada prueba.

    beforeEach(() => {
        originalReadyState = mongoose.connection.readyState;
    });

    // Restauramos el estado original al finalizar cada prueba.

    afterEach(() => {
        mongoose.connection.readyState = originalReadyState;
    });

    it("debe responder 200 cuando MongoDB está conectado", async function () {
        mongoose.connection.readyState = 1;

        const response = await request(app)
            .get("/health");

        expect(response.status).to.equal(200);
        expect(response.body.status).to.equal("healthy");
        expect(response.body.database).to.equal("connected");
    });

    it("debe responder 503 cuando MongoDB está desconectado", async function () {
        mongoose.connection.readyState = 0;

        const response = await request(app)
            .get("/health");

        expect(response.status).to.equal(503);
        expect(response.body.status).to.equal("unhealthy");
        expect(response.body.database).to.equal("disconnected");
    });

    it("debe informar el entorno, tiempo de actividad y fecha", async function () {
        mongoose.connection.readyState = 1;

        const response = await request(app)
            .get("/health");

        expect(response.body.environment).to.equal(config.nodeEnv);
        expect(response.body.uptime).to.be.a("number");
        expect(response.body.uptime).to.be.greaterThan(0);
        expect(response.body.timestamp).to.be.a("string");
        expect(new Date(response.body.timestamp).toISOString())
            .to.equal(response.body.timestamp);
    });

    it("no debe exponer credenciales ni la URI de MongoDB", async function () {
        mongoose.connection.readyState = 1;

        const response = await request(app)
            .get("/health");

        expect(response.body).not.to.have.property("mongoUri");
        expect(response.body).not.to.have.property("MONGODB_URI");
        expect(JSON.stringify(response.body))
            .not.to.include(config.mongoUri);
    });

});
