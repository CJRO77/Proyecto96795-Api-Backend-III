import { expect } from "chai";
import request from "supertest";
import app from "../src/app.js";
import { expectError } from "./helpers.js";

// Pruebas generales para rutas inexistentes y métodos no definidos


describe("Rutas inexistentes", () => {
    it("GET a una ruta que no existe responde 404 ROUTE_NOT_FOUND", async () => {
        const res = await request(app).get("/api/ruta-que-no-existe");

        expectError(res, 404, "ROUTE_NOT_FOUND");
        expect(res.body.message).to.equal("La ruta solicitada no existe");
    });

    it("POST a una ruta que no existe también responde 404 ROUTE_NOT_FOUND", async () => {
        const res = await request(app).post("/api/ruta-que-no-existe").send({ dato: 1 });

        expectError(res, 404, "ROUTE_NOT_FOUND");
    });

    it("un método no definido sobre una ruta existente responde 404 ROUTE_NOT_FOUND", async () => {
        const res = await request(app).delete("/api/orders");

        expectError(res, 404, "ROUTE_NOT_FOUND");
    });
});