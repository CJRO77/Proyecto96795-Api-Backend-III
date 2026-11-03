import { expect } from "chai";
import request from "supertest";
import app from "../src/app.js";
import UserModel from "../src/models/user.model.js";
import { createUser, expectSuccess, expectError, NON_EXISTENT_ID, INVALID_ID } from "./helpers.js";

// Función para generar un body de usuario válido, con posibilidad de sobrescribir campos

const validUserBody = (overrides = {}) => ({
    firstName: "Ana",
    lastName: "Pérez",
    email: "ana.perez@test.com",
    password: "coder123",
    ...overrides
});

describe("Users API", () => {

    describe("GET /api/users", () => {
        it("devuelve un arreglo vacío si no hay usuarios", async () => {
            const res = await request(app).get("/api/users");

            expectSuccess(res, 200);
            expect(res.body.payload).to.be.an("array").that.is.empty;
        });

        it("lista los usuarios existentes sin exponer password ni __v", async () => {
            await createUser();
            await createUser();

            const res = await request(app).get("/api/users");

            expectSuccess(res, 200);
            expect(res.body.payload).to.be.an("array").with.lengthOf(2);

            res.body.payload.forEach((user) => {
                expect(user).to.include.keys("_id", "firstName", "lastName", "email", "role");
                expect(user).to.not.have.property("password");
                expect(user).to.not.have.property("__v");
            });
        });
    });

    describe("POST /api/users", () => {
        it("crea un usuario válido: 201, rol USER y sin password en la respuesta", async () => {
            const res = await request(app).post("/api/users").send(validUserBody());

            expectSuccess(res, 201);
            expect(res.body.message).to.equal("Usuario creado correctamente");
            expect(res.body.payload).to.include({
                firstName: "Ana",
                lastName: "Pérez",
                email: "ana.perez@test.com",
                role: "USER"
            });
            expect(res.body.payload).to.have.property("_id");
            expect(res.body.payload).to.not.have.property("password");
            expect(res.body.payload).to.not.have.property("__v");
        });

        it("guarda el password hasheado con bcrypt, nunca en texto plano", async () => {
            const res = await request(app).post("/api/users").send(validUserBody());

            const stored = await UserModel.findById(res.body.payload._id);

            expect(stored.password).to.not.equal("coder123");
            expect(stored.password).to.match(/^\$2[aby]\$/);
        });

        it("ignora el role enviado: nadie se auto-asigna ADMIN al registrarse", async () => {
            const res = await request(app).post("/api/users").send(validUserBody({ role: "ADMIN" }));

            expectSuccess(res, 201);
            expect(res.body.payload.role).to.equal("USER");
        });

        it("responde 400 VALIDATION_ERROR si faltan campos obligatorios", async () => {
            const res = await request(app).post("/api/users").send({ firstName: "Ana" });

            expectError(res, 400, "VALIDATION_ERROR");
            expect(res.body.details).to.include("obligatorios");
        });

        it("responde 400 VALIDATION_ERROR si no se envía body", async () => {
            const res = await request(app).post("/api/users");

            expectError(res, 400, "VALIDATION_ERROR");
        });

        it("responde 400 VALIDATION_ERROR si el body no es un JSON válido", async () => {
            const res = await request(app)
                .post("/api/users")
                .set("Content-Type", "application/json")
                .send('{"firstName": "Ana",');

            expectError(res, 400, "VALIDATION_ERROR");
            expect(res.body.details).to.include("JSON");
        });

        it("responde 409 USER_ALREADY_EXISTS si el email ya está registrado", async () => {
            await createUser({ email: "ana.perez@test.com" });

            const res = await request(app).post("/api/users").send(validUserBody());

            expectError(res, 409, "USER_ALREADY_EXISTS");
            expect(await UserModel.countDocuments()).to.equal(1);
        });
    });

    describe("GET /api/users/:id", () => {
        it("devuelve el usuario pedido", async () => {
            const user = await createUser({ firstName: "Lucía" });

            const res = await request(app).get(`/api/users/${user._id}`);

            expectSuccess(res, 200);
            expect(res.body.payload).to.include({ _id: user._id.toString(), firstName: "Lucía" });
            expect(res.body.payload).to.not.have.property("password");
        });

        it("responde 400 INVALID_ID si el id no tiene formato de ObjectId", async () => {
            const res = await request(app).get(`/api/users/${INVALID_ID}`);

            expectError(res, 400, "INVALID_ID");
        });

        it("responde 404 USER_NOT_FOUND si el usuario no existe", async () => {
            const res = await request(app).get(`/api/users/${NON_EXISTENT_ID}`);

            expectError(res, 404, "USER_NOT_FOUND");
        });
    });

    describe("PUT /api/users/:id", () => {
        it("actualiza solo los campos enviados", async () => {
            const user = await createUser({ firstName: "Lucía", lastName: "Gómez" });

            const res = await request(app).put(`/api/users/${user._id}`).send({ firstName: "Lucía María" });

            expectSuccess(res, 200);
            expect(res.body.message).to.equal("Usuario actualizado correctamente");
            expect(res.body.payload).to.include({ firstName: "Lucía María", lastName: "Gómez" });
            expect(res.body.payload).to.not.have.property("password");
        });

        it("vuelve a hashear el password si se envía uno nuevo", async () => {
            const user = await createUser();

            await request(app).put(`/api/users/${user._id}`).send({ password: "nuevaClave123" });

            const stored = await UserModel.findById(user._id);
            expect(stored.password).to.not.equal("nuevaClave123");
            expect(stored.password).to.match(/^\$2[aby]\$/);
        });

        it("responde 400 INVALID_ID si el id no tiene formato de ObjectId", async () => {
            const res = await request(app).put(`/api/users/${INVALID_ID}`).send({ firstName: "x" });

            expectError(res, 400, "INVALID_ID");
        });

        it("responde 404 USER_NOT_FOUND si el usuario no existe", async () => {
            const res = await request(app).put(`/api/users/${NON_EXISTENT_ID}`).send({ firstName: "x" });

            expectError(res, 404, "USER_NOT_FOUND");
        });
    });

    describe("DELETE /api/users/:id", () => {
        it("elimina el usuario", async () => {
            const user = await createUser();

            const res = await request(app).delete(`/api/users/${user._id}`);

            expectSuccess(res, 200);
            expect(res.body.message).to.equal("Usuario eliminado correctamente");
            expect(await UserModel.findById(user._id)).to.equal(null);
        });

        it("responde 400 INVALID_ID si el id no tiene formato de ObjectId", async () => {
            const res = await request(app).delete(`/api/users/${INVALID_ID}`);

            expectError(res, 400, "INVALID_ID");
        });

        it("responde 404 USER_NOT_FOUND si el usuario no existe", async () => {
            const res = await request(app).delete(`/api/users/${NON_EXISTENT_ID}`);

            expectError(res, 404, "USER_NOT_FOUND");
        });
    });
});