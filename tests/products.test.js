import { expect } from "chai";
import request from "supertest";
import app from "../src/app.js";
import ProductModel from "../src/models/product.model.js";
import { PRODUCT_STATUS } from "../src/constants/index.js";
import { createProduct, expectSuccess, expectError, NON_EXISTENT_ID, INVALID_ID } from "./helpers.js";

// Función para generar un body de producto válido, con posibilidad de sobrescribir campos

const validProductBody = (overrides = {}) => ({
    name: "Caja de envío mediana",
    description: "Caja de cartón para envíos",
    price: 2500,
    stock: 10,
    ...overrides
});

describe("Products API", () => {

    describe("GET /api/products", () => {
        it("devuelve un arreglo vacío si no hay productos", async () => {
            const res = await request(app).get("/api/products");

            expectSuccess(res, 200);
            expect(res.body.payload).to.be.an("array").that.is.empty;
        });

        it("lista solo los productos AVAILABLE (oculta los OUT_OF_STOCK)", async () => {
            await createProduct({ name: "Disponible", stock: 5, status: PRODUCT_STATUS.AVAILABLE });
            await createProduct({ name: "Agotado", stock: 0, status: PRODUCT_STATUS.OUT_OF_STOCK });

            const res = await request(app).get("/api/products");

            expectSuccess(res, 200);
            expect(res.body.payload).to.have.lengthOf(1);
            expect(res.body.payload[0]).to.include({ name: "Disponible", status: "AVAILABLE" });
            expect(res.body.payload[0]).to.not.have.property("__v");
        });
    });

    describe("POST /api/products", () => {
        it("crea un producto válido con status AVAILABLE", async () => {
            const res = await request(app).post("/api/products").send(validProductBody());

            expectSuccess(res, 201);
            expect(res.body.message).to.equal("Producto creado correctamente");
            expect(res.body.payload).to.include({ name: "Caja de envío mediana", price: 2500, stock: 10, status: "AVAILABLE" });
            expect(res.body.payload).to.have.property("_id");
            expect(res.body.payload).to.not.have.property("__v");
        });

        it("calcula el status OUT_OF_STOCK cuando el stock inicial es 0", async () => {
            const res = await request(app).post("/api/products").send(validProductBody({ stock: 0 }));

            expectSuccess(res, 201);
            expect(res.body.payload.status).to.equal("OUT_OF_STOCK");
        });

        it("responde 400 VALIDATION_ERROR si falta un campo obligatorio (description)", async () => {
            const { description, ...withoutDescription } = validProductBody();

            const res = await request(app).post("/api/products").send(withoutDescription);

            expectError(res, 400, "VALIDATION_ERROR");
            expect(await ProductModel.countDocuments()).to.equal(0);
        });

        it("responde 400 VALIDATION_ERROR si no se envía body", async () => {
            const res = await request(app).post("/api/products");

            expectError(res, 400, "VALIDATION_ERROR");
        });

        it("responde 400 VALIDATION_ERROR si el price es negativo", async () => {
            const res = await request(app).post("/api/products").send(validProductBody({ price: -10 }));

            expectError(res, 400, "VALIDATION_ERROR");
            expect(res.body.details).to.include("price");
        });

        it("responde 400 VALIDATION_ERROR si el stock es negativo", async () => {
            const res = await request(app).post("/api/products").send(validProductBody({ stock: -5 }));

            expectError(res, 400, "VALIDATION_ERROR");
            expect(res.body.details).to.include("stock");
        });
    });

    describe("GET /api/products/:id", () => {
        it("devuelve el producto pedido (incluso si está agotado)", async () => {
            const product = await createProduct({ stock: 0, status: PRODUCT_STATUS.OUT_OF_STOCK });

            const res = await request(app).get(`/api/products/${product._id}`);

            expectSuccess(res, 200);
            expect(res.body.payload).to.include({ _id: product._id.toString(), status: "OUT_OF_STOCK" });
        });

        it("responde 400 INVALID_ID si el id no tiene formato de ObjectId", async () => {
            const res = await request(app).get(`/api/products/${INVALID_ID}`);

            expectError(res, 400, "INVALID_ID");
        });

        it("responde 404 PRODUCT_NOT_FOUND si el producto no existe", async () => {
            const res = await request(app).get(`/api/products/${NON_EXISTENT_ID}`);

            expectError(res, 404, "PRODUCT_NOT_FOUND");
        });
    });

    describe("PUT /api/products/:id", () => {
        it("actualiza solo los campos enviados", async () => {
            const product = await createProduct({ name: "Original", price: 100, stock: 4 });

            const res = await request(app).put(`/api/products/${product._id}`).send({ price: 3200 });

            expectSuccess(res, 200);
            expect(res.body.message).to.equal("Producto actualizado correctamente");
            expect(res.body.payload).to.include({ name: "Original", price: 3200, stock: 4 });
        });

        it("recalcula el status a OUT_OF_STOCK cuando el stock pasa a 0", async () => {
            const product = await createProduct({ stock: 5 });

            const res = await request(app).put(`/api/products/${product._id}`).send({ stock: 0 });

            expectSuccess(res, 200);
            expect(res.body.payload.status).to.equal("OUT_OF_STOCK");
        });

        it("recalcula el status a AVAILABLE cuando se repone el stock", async () => {
            const product = await createProduct({ stock: 0, status: PRODUCT_STATUS.OUT_OF_STOCK });

            const res = await request(app).put(`/api/products/${product._id}`).send({ stock: 8 });

            expectSuccess(res, 200);
            expect(res.body.payload.status).to.equal("AVAILABLE");
        });

        it("responde 400 VALIDATION_ERROR si el stock enviado es negativo y no modifica el producto", async () => {
            const product = await createProduct({ stock: 5 });

            const res = await request(app).put(`/api/products/${product._id}`).send({ stock: -3 });

            expectError(res, 400, "VALIDATION_ERROR");
            expect((await ProductModel.findById(product._id)).stock).to.equal(5);
        });

        it("responde 400 INVALID_ID si el id no tiene formato de ObjectId", async () => {
            const res = await request(app).put(`/api/products/${INVALID_ID}`).send({ stock: 1 });

            expectError(res, 400, "INVALID_ID");
        });

        it("responde 404 PRODUCT_NOT_FOUND si el producto no existe", async () => {
            const res = await request(app).put(`/api/products/${NON_EXISTENT_ID}`).send({ stock: 1 });

            expectError(res, 404, "PRODUCT_NOT_FOUND");
        });
    });

    describe("DELETE /api/products/:id", () => {
        it("elimina el producto", async () => {
            const product = await createProduct();

            const res = await request(app).delete(`/api/products/${product._id}`);

            expectSuccess(res, 200);
            expect(res.body.message).to.equal("Producto eliminado correctamente");
            expect(await ProductModel.findById(product._id)).to.equal(null);
        });

        it("responde 400 INVALID_ID si el id no tiene formato de ObjectId", async () => {
            const res = await request(app).delete(`/api/products/${INVALID_ID}`);

            expectError(res, 400, "INVALID_ID");
        });

        it("responde 404 PRODUCT_NOT_FOUND si el producto no existe", async () => {
            const res = await request(app).delete(`/api/products/${NON_EXISTENT_ID}`);

            expectError(res, 404, "PRODUCT_NOT_FOUND");
        });
    });
});