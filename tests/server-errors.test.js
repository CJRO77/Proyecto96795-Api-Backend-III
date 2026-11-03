import { expect } from "chai";
import request from "supertest";
import app from "../src/app.js";
import { usersRepository } from "../src/repositories/users.repository.js";
import { productsRepository } from "../src/repositories/products.repository.js";
import { ordersRepository } from "../src/repositories/orders.repository.js";
import { deliveriesRepository } from "../src/repositories/deliveries.repository.js";
import { expectError, NON_EXISTENT_ID } from "./helpers.js";

const repositories = [usersRepository, productsRepository, ordersRepository, deliveriesRepository];

// Todos los endpoints que tocan la base de datos y documentan un 500 en Swagger.
// Los datos son válidos a propósito: el único problema es que la base "se cae".

const DATABASE_ENDPOINTS = [
    ["get", "/api/users"],
    ["post", "/api/users", { firstName: "Ana", lastName: "Pérez", email: "ana@test.com", password: "coder123" }],
    ["get", `/api/users/${NON_EXISTENT_ID}`],
    ["put", `/api/users/${NON_EXISTENT_ID}`, { firstName: "Ana" }],
    ["delete", `/api/users/${NON_EXISTENT_ID}`],

    ["get", "/api/products"],
    ["post", "/api/products", { name: "Caja", description: "Caja de cartón", price: 100, stock: 5 }],
    ["get", `/api/products/${NON_EXISTENT_ID}`],
    ["put", `/api/products/${NON_EXISTENT_ID}`, { stock: 1 }],
    ["delete", `/api/products/${NON_EXISTENT_ID}`],

    ["get", "/api/orders"],
    ["post", "/api/orders", { customer: NON_EXISTENT_ID, deliveryAddress: "X", items: [{ name: "a", quantity: 1, price: 1 }] }],
    ["get", `/api/orders/${NON_EXISTENT_ID}`],
    ["patch", `/api/orders/${NON_EXISTENT_ID}/status`, { status: "IN_TRANSIT" }],

    ["get", "/api/deliveries"],
    ["post", "/api/deliveries", { order: NON_EXISTENT_ID }],
    ["get", `/api/deliveries/${NON_EXISTENT_ID}`],
    ["patch", `/api/deliveries/${NON_EXISTENT_ID}/status`, { status: "DELIVERED" }]
];

describe("Errores inesperados del servidor (500)", () => {
    let originals;

    // Simula una caída de la base de datos: toda operación de todos los repositories falla.
    
    beforeEach(() => {
        originals = repositories.map((repository) => {
            const saved = {};
            Object.keys(repository).forEach((name) => {
                saved[name] = repository[name];
                repository[name] = async () => {
                    throw new Error("conexión con la base de datos perdida (simulada)");
                };
            });
            return saved;
        });
    });

    afterEach(() => {
        repositories.forEach((repository, index) => Object.assign(repository, originals[index]));
    });

    DATABASE_ENDPOINTS.forEach(([method, url, body]) => {
        it(`${method.toUpperCase()} ${url.replace(NON_EXISTENT_ID, ":id")} responde 500 INTERNAL_SERVER_ERROR con el formato uniforme`, async () => {
            const res = await request(app)[method](url).send(body);

            expectError(res, 500, "INTERNAL_SERVER_ERROR");
            expect(res.body.message).to.equal("Ocurrió un error inesperado en el servidor");
        });
    });
});