
import { expect } from "chai";
import request from "supertest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { unlink } from "node:fs/promises";

import app from "../src/app.js";
import UserModel from "../src/models/user.model.js";
import DeliveryModel from "../src/models/delivery.model.js";
import {
    createUser,
    createDelivery,
    expectSuccess,
    expectError,
    NON_EXISTENT_ID,
} from "./helpers.js";

import { MAX_FILE_SIZE } from "../src/config/multer.config.js";

// Obtener la ruta absoluta del archivo actual y su directorio.

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Archivo PDF válido utilizado en las pruebas.

const testDocument = path.join(
    __dirname,
    "fixtures",
    "documento-prueba.pdf"
);

// Contenido que no tiene una firma PDF válida.

const invalidSignature = Buffer.from("Este contenido no es un PDF");

// Eliminar un archivo físico después de comprobar su carga.

const removeUploadedFile = async (relativePath) => {
    if (!relativePath) return;

    const absolutePath = path.resolve(process.cwd(), relativePath);

    await unlink(absolutePath).catch(() => {});
};

describe("Carga de archivos", () => {

    describe("POST /api/users/:id/documents", () => {

        it("carga un documento correctamente y lo asocia al usuario", async () => {
            const user = await createUser();

            const res = await request(app)
                .post(`/api/users/${user._id}/documents`)
                .field("type", "USER_DOCUMENT")
                .attach("document", testDocument);

            expectSuccess(res, 201);

            expect(res.body.message).to.equal(
                "Documento cargado y asociado correctamente"
            );

            const storedUser = await UserModel.findById(user._id);

            expect(storedUser.documents).to.have.lengthOf(1);

            expect(storedUser.documents[0]).to.include({
                originalName: "documento-prueba.pdf",
                mimeType: "application/pdf",
                type: "USER_DOCUMENT",
            });

            expect(storedUser.documents[0].fileName)
                .to.be.a("string").and.not.empty;

            expect(storedUser.documents[0].path)
                .to.include("uploads/users/");

            expect(storedUser.documents[0].size).to.be.greaterThan(0);

            expect(storedUser.documents[0].uploadedAt).to.exist;

            await removeUploadedFile(storedUser.documents[0].path);
        });

        it("responde 400 FILE_REQUIRED si no se envía ningún archivo", async () => {
            const user = await createUser();

            const res = await request(app)
                .post(`/api/users/${user._id}/documents`)
                .field("type", "USER_DOCUMENT");

            expectError(res, 400, "FILE_REQUIRED");

            const storedUser = await UserModel.findById(user._id);

            expect(storedUser.documents).to.have.lengthOf(0);
        });

        it("responde 400 INVALID_DOCUMENT_TYPE si el tipo de documento no es válido", async () => {
            const user = await createUser();

            const res = await request(app)
                .post(`/api/users/${user._id}/documents`)
                .field("type", "INVALID_TYPE")
                .attach("document", testDocument);

            expectError(res, 400, "INVALID_DOCUMENT_TYPE");

            const storedUser = await UserModel.findById(user._id);

            expect(storedUser.documents).to.have.lengthOf(0);
        });

        it("rechaza archivos que superan el límite de 5 MB", async () => {
            const user = await createUser();

            const largeFile = Buffer.alloc(MAX_FILE_SIZE + 1);

            const res = await request(app)
                .post(`/api/users/${user._id}/documents`)
                .field("type", "USER_DOCUMENT")
                .attach("document", largeFile, {
                    filename: "documento-grande.pdf",
                    contentType: "application/pdf",
                });

            expectError(res, 413, "FILE_TOO_LARGE");

            const storedUser = await UserModel.findById(user._id);

            expect(storedUser.documents).to.have.lengthOf(0);
        });

        it("rechaza archivos con una extensión no permitida", async () => {
            const user = await createUser();

            const res = await request(app)
                .post(`/api/users/${user._id}/documents`)
                .field("type", "USER_DOCUMENT")
                .attach("document", testDocument, {
                    filename: "documento.txt",
                    contentType: "application/pdf",
                });

            expectError(res, 400, "INVALID_FILE_TYPE");

            const storedUser = await UserModel.findById(user._id);

            expect(storedUser.documents).to.have.lengthOf(0);
        });

        it("rechaza archivos PDF cuya firma interna no es válida", async () => {
            const user = await createUser();

            const res = await request(app)
                .post(`/api/users/${user._id}/documents`)
                .field("type", "USER_DOCUMENT")
                .attach("document", invalidSignature, {
                    filename: "documento-falso.pdf",
                    contentType: "application/pdf",
                });

            expectError(res, 400, "INVALID_FILE_TYPE");

            const storedUser = await UserModel.findById(user._id);

            expect(storedUser.documents).to.have.lengthOf(0);
        });
    });

    describe("POST /api/deliveries/:id/proof", () => {

        it("carga un comprobante correctamente y lo asocia a la entrega", async () => {
            const delivery = await createDelivery();

            const res = await request(app)
                .post(`/api/deliveries/${delivery._id}/proof`)
                .attach("proof", testDocument);

            expectSuccess(res, 201);

            expect(res.body.message).to.equal(
                "Comprobante de entrega cargado correctamente"
            );

            const storedDelivery = await DeliveryModel.findById(delivery._id);

            expect(storedDelivery.proof).to.exist;

            expect(storedDelivery.proof).to.include({
                originalName: "documento-prueba.pdf",
                mimeType: "application/pdf",
            });

            expect(storedDelivery.proof.fileName)
                .to.be.a("string").and.not.empty;

            expect(storedDelivery.proof.path)
                .to.include("uploads/deliveries/proofs/");

            expect(storedDelivery.proof.size).to.be.greaterThan(0);

            expect(storedDelivery.proof.uploadedAt).to.exist;

            await removeUploadedFile(storedDelivery.proof.path);
        });

        it("responde 400 FILE_REQUIRED si no se envía ningún comprobante", async () => {
            const delivery = await createDelivery();

            const res = await request(app).post(
                `/api/deliveries/${delivery._id}/proof`
            );

            expectError(res, 400, "FILE_REQUIRED");

            const storedDelivery = await DeliveryModel.findById(delivery._id);

            expect(storedDelivery.proof).to.equal(null);
        });

        it("responde 404 DELIVERY_NOT_FOUND si la entrega no existe", async () => {
            const res = await request(app)
                .post(`/api/deliveries/${NON_EXISTENT_ID}/proof`)
                .attach("proof", testDocument);

            expectError(res, 404, "DELIVERY_NOT_FOUND");
        });
    });
});
