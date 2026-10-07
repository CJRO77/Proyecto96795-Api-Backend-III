import { mocksService } from "../services/mocks.service.js";
import { USER_ROLES } from "../constants/index.js";
import { CustomError } from "../errors/CustomError.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Mapeo de entidades a nombres de colección para la respuesta de seedData.

const ENTITY_TO_COLLECTION_LABEL = {
    users: "usuarios",
    drivers: "repartidores",
    orders: "pedidos",
    deliveries: "entregas"
};

export const getMockUsers = asyncHandler(async (req, res) => {
    const { qty = 10 } = req.query;
    const users = mocksService.getMockUsers(qty, USER_ROLES.CUSTOMER);
    res.status(200).json({ status: "success", payload: users });
});

export const getMockDrivers = asyncHandler(async (req, res) => {
    const { qty = 10 } = req.query;
    const drivers = mocksService.getMockDrivers(qty);
    res.status(200).json({ status: "success", payload: drivers });
});

export const getMockOrders = asyncHandler(async (req, res) => {
    const { qty = 10 } = req.query;
    const orders = mocksService.getMockOrders(qty);
    res.status(200).json({ status: "success", payload: orders });
});

export const getMockDeliveries = asyncHandler(async (req, res) => {
    const { qty = 10 } = req.query;
    const deliveries = mocksService.getMockDeliveries(qty);
    res.status(200).json({ status: "success", payload: deliveries });
});

export const seedData = asyncHandler(async (req, res) => {
    const { qty = 10, entity = "users" } = req.query;

    const seeders = {
        users: () => mocksService.seedUsers(qty, USER_ROLES.CUSTOMER),
        drivers: () => mocksService.seedDrivers(qty),
        orders: () => mocksService.seedOrders(qty),
        deliveries: () => mocksService.seedDeliveries(qty)
    };

    const seeder = seeders[entity];

    if (!seeder) {
        throw new CustomError(
            "INVALID_MOCK_ENTITY",
            `entity recibido: "${entity}". Valores permitidos: ${Object.keys(seeders).join(", ")}`
        );
    }

    const insertedCount = await seeder();

    res.status(201).json({
        status: "success",
        payload: {
            insertados: insertedCount,
            coleccion: ENTITY_TO_COLLECTION_LABEL[entity]
        }
    });
});