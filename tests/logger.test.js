import { expect } from "chai";
import request from "supertest";
import app from "../src/app.js";
import logger from "../src/config/logger.config.js";
import { expectSuccess } from "./helpers.js";

// Función para generar un body de usuario válido, con posibilidad de sobrescribir campos

describe("Logger API", () => {

    describe("GET /api/logger-test", () => {
        it("responde 200 y confirma que generó logs en los 6 niveles", async () => {
            const res = await request(app).get("/api/logger-test");

            expectSuccess(res, 200);
            expect(res.body.payload).to.have.property("message", "Logs generados correctamente en los 6 niveles");
        });
    });

    describe("Configuración del logger", () => {
        it("define los 6 niveles de log del proyecto", () => {
            expect(logger.levels).to.have.all.keys("debug", "http", "info", "warning", "error", "fatal");
        });

        it("ordena los niveles de más grave (número menor) a menos grave", () => {
            const { fatal, error, warning, info, http, debug } = logger.levels;

            expect(fatal).to.be.lessThan(error);
            expect(error).to.be.lessThan(warning);
            expect(warning).to.be.lessThan(info);
            expect(info).to.be.lessThan(http);
            expect(http).to.be.lessThan(debug);
        });

        it("está silenciado en el entorno de test (no ensucia la consola)", () => {
            expect(logger.silent).to.equal(true);
        });

        it("no tiene transporte de archivos en el entorno de test (no crea la carpeta logs/)", () => {
            const transportNames = logger.transports.map((transport) => transport.constructor.name);

            expect(transportNames).to.include("Console");
            expect(transportNames).to.not.include("DailyRotateFile");
        });
    });
});