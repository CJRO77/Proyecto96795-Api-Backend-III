import { expect } from "chai";
import request from "supertest";
import app from "../src/app.js";
import { swaggerSpecs } from "../src/docs/swagger.config.js";
import { ERROR_DICTIONARY } from "../src/errors/errorDictionary.js";
import { config } from "../src/config/env.config.js";
import { NON_EXISTENT_ID } from "./helpers.js";



const HTTP_METHODS = ["get", "post", "put", "patch", "delete"];

describe("Swagger (documentación)", () => {

    describe("GET /api/docs", () => {
        it("sirve la interfaz de Swagger UI", async () => {
            const res = await request(app).get("/api/docs/");

            expect(res.status).to.equal(200);
            expect(res.headers["content-type"]).to.include("text/html");
            expect(res.text).to.include("swagger-ui");
        });

        it("redirige /api/docs a /api/docs/", async () => {
            const res = await request(app).get("/api/docs");

            expect(res.status).to.be.oneOf([301, 302]);
            expect(res.headers.location).to.equal("/api/docs/");
        });
    });

    describe("Información general de la especificación", () => {
        it("incluye nombre, versión y descripción de la API", () => {
            expect(swaggerSpecs.info.title).to.equal("ShipNow API");
            expect(swaggerSpecs.info.version).to.be.a("string").and.not.equal("");
            expect(swaggerSpecs.info.description).to.be.a("string").and.not.equal("");
        });

        it("documenta el servidor local con el puerto de la configuración", () => {
            expect(swaggerSpecs.servers[0].url).to.equal(`http://localhost:${config.port}`);
        });

        it("agrupa los endpoints en los 6 tags del proyecto", () => {
            const tagNames = swaggerSpecs.tags.map((tag) => tag.name);

            expect(tagNames).to.have.members(["Users", "Products", "Orders", "Deliveries", "Mocks", "Logger"]);
        });
    });

    describe("Coherencia entre lo documentado y la API real", () => {
        it("todos los códigos de error documentados existen en el diccionario de errores, y viceversa", () => {
            const documentedCodes = swaggerSpecs.components.schemas.ErrorResponse.properties.error.enum;

            expect(documentedCodes).to.have.members(Object.keys(ERROR_DICTIONARY));
        });

        // Un test por cada endpoint documentado: si Swagger documenta una ruta que la API no tiene, falla.
        
        Object.entries(swaggerSpecs.paths).forEach(([path, pathItem]) => {
            HTTP_METHODS.filter((method) => pathItem[method]).forEach((method) => {
                it(`${method.toUpperCase()} ${path} está documentado y existe en la API`, async () => {
                    const url = path.replace("{id}", NON_EXISTENT_ID);

                    const res = await request(app)[method](url);

                    expect(res.body.error).to.not.equal("ROUTE_NOT_FOUND");
                });
            });
        });

        it("cada endpoint documentado declara al menos una respuesta exitosa", () => {
            Object.entries(swaggerSpecs.paths).forEach(([path, pathItem]) => {
                HTTP_METHODS.filter((method) => pathItem[method]).forEach((method) => {
                    const statusCodes = Object.keys(pathItem[method].responses);

                    expect(statusCodes.some((code) => code.startsWith("2")), `${method.toUpperCase()} ${path}`).to.equal(true);
                });
            });
        });
    });
});