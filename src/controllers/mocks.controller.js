import { mocksService } from "../services/mocks.service.js";
import { USER_ROLES } from "../constants/index.js";

// Controlador de mocks: maneja las solicitudes HTTP relacionadas con la generación de datos simulados y su persistencia en MongoDB

const ENTITY_TO_COLLECTION_LABEL = {
    users: "usuarios",
    drivers: "repartidores",
    orders: "pedidos",
    deliveries: "entregas"
};

const handleError = (res, error) => {
    const statusCode = error.statusCode || 500;
    res.status(statusCode).json({ success: false, message: error.message });
};

// ---------- GET: devuelven datos simulados sin guardarlos ----------

export const getMockUsers = (req, res) => {
    try {
        const { qty = 10 } = req.query;
        const users = mocksService.getMockUsers(qty, USER_ROLES.CUSTOMER);
        res.status(200).json(users);
    } catch (error) {
        handleError(res, error);
    }
};

export const getMockDrivers = (req, res) => {
    try {
        const { qty = 10 } = req.query;
        const drivers = mocksService.getMockDrivers(qty);
        res.status(200).json(drivers);
    } catch (error) {
        handleError(res, error);
    }
};

export const getMockOrders = (req, res) => {
    try {
        const { qty = 10 } = req.query;
        const orders = mocksService.getMockOrders(qty);
        res.status(200).json(orders);
    } catch (error) {
        handleError(res, error);
    }
};

export const getMockDeliveries = (req, res) => {
    try {
        const { qty = 10 } = req.query;
        const deliveries = mocksService.getMockDeliveries(qty);
        res.status(200).json(deliveries);
    } catch (error) {
        handleError(res, error);
    }
};

// ---------- POST: genera e inserta datos reales en MongoDB ----------

export const seedData = async (req, res) => {
    try {
        const { qty = 10, entity = "users" } = req.query;

        const seeders = {
            users: () => mocksService.seedUsers(qty, USER_ROLES.CUSTOMER),
            drivers: () => mocksService.seedDrivers(qty),
            orders: () => mocksService.seedOrders(qty),
            deliveries: () => mocksService.seedDeliveries(qty)
        };

        const seeder = seeders[entity];

        if (!seeder) {
            return res.status(400).json({
                success: false,
                message: `entity inválido: "${entity}". Valores permitidos: ${Object.keys(seeders).join(", ")}`
            });
        }

        const insertedCount = await seeder();

        res.status(201).json({
            insertados: insertedCount,
            coleccion: ENTITY_TO_COLLECTION_LABEL[entity]
        });
    } catch (error) {
        handleError(res, error);
    }
};