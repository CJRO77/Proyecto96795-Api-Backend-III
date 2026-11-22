import { expect } from "chai";
import UserModel from "../src/models/user.model.js";
import ProductModel from "../src/models/product.model.js";
import OrderModel from "../src/models/order.model.js";
import DeliveryModel from "../src/models/delivery.model.js";
import { USER_ROLES, PRODUCT_STATUS, ORDER_STATUS, DELIVERY_PRIORITY, DELIVERY_STATUS } from "../src/constants/index.js";


// Ids para casos de error


// ObjectId con formato válido pero que no existe en la base de testing.

export const NON_EXISTENT_ID = "665f4d0a8f9a1b001234abcd";

// Id con formato inválido (no es un ObjectId).
export const INVALID_ID = "abc";

// Limpieza: deja la base de testing vacía.
// Es seguro porque tests/setup.js se niega a correr si la base no es de testing.


export const cleanDatabase = async () => {
    await Promise.all([
        UserModel.deleteMany({}),
        ProductModel.deleteMany({}),
        OrderModel.deleteMany({}),
        DeliveryModel.deleteMany({})
    ]);
};

// Fábricas de datos de prueba. Crean los documentos directo en la base de
// testing, así cada test prepara lo que necesita sin depender de otros tests.


let counter = 0;
const uniqueEmail = (prefix) => `${prefix}-${Date.now()}-${counter++}@test.com`;

export const createUser = (overrides = {}) => UserModel.create({
    firstName: "Test",
    lastName: "User",
    email: uniqueEmail("user"),
    password: "password-de-prueba",
    role: USER_ROLES.CUSTOMER,
    ...overrides
});

export const createDriver = (overrides = {}) => createUser({
    firstName: "Test",
    lastName: "Driver",
    email: uniqueEmail("driver"),
    role: USER_ROLES.DRIVER,
    isAvailable: true,
    ...overrides
});

export const createProduct = (overrides = {}) => ProductModel.create({
    name: "Caja de prueba",
    description: "Producto de prueba",
    price: 2500,
    stock: 10,
    status: PRODUCT_STATUS.AVAILABLE,
    ...overrides
});

export const createOrder = async (overrides = {}) => {
    const customer = overrides.customer ?? (await createUser())._id;

    return OrderModel.create({
        customer,
        items: [{ name: "Paquete mediano", quantity: 2, price: 1500 }],
        deliveryAddress: "Av. Siempre Viva 742",
        total: 3000,
        status: ORDER_STATUS.CREATED,
        priority: DELIVERY_PRIORITY.NORMAL,
        ...overrides
    });
};

export const createDelivery = async (overrides = {}) => {
    const order = overrides.order ?? (await createOrder())._id;

    return DeliveryModel.create({
        order,
        driver: null,
        status: DELIVERY_STATUS.PENDING,
        ...overrides
    });
};

// Aserciones del contrato de la API (el mismo que documenta Swagger).
// Validan mucho más que el status code: forma completa del body.


export const expectSuccess = (res, statusCode) => {
    expect(res.status, JSON.stringify(res.body)).to.equal(statusCode);
    expect(res.body).to.have.property("status", "success");
};

export const expectError = (res, statusCode, errorCode) => {
    expect(res.status, JSON.stringify(res.body)).to.equal(statusCode);
    expect(res.body).to.have.property("status", "error");
    expect(res.body).to.have.property("error", errorCode);
    expect(res.body.message).to.be.a("string").and.not.equal("");
    
    // Nunca se filtra información técnica interna.
    expect(res.body).to.not.have.property("stack");
};