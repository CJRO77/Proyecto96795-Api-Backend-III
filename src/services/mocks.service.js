import bcrypt from "bcryptjs";
import { usersRepository } from "../repositories/users.repository.js";
import { ordersRepository } from "../repositories/orders.repository.js";
import { deliveriesRepository } from "../repositories/deliveries.repository.js";
import {
    generateMockUsers,
    generateMockDrivers
} from "../mocks/users.mock.js";
import { generateMockOrders } from "../mocks/orders.mock.js";
import { generateMockDeliveries } from "../mocks/deliveries.mock.js";
import { USER_ROLES, MOCK_LIMITS } from "../constants/index.js";

// Servicio de mocks: generación de datos simulados y persistencia en MongoDB

const SALT_ROUNDS = 10;

const validateQty = (qty) => {
    const parsedQty = Number(qty);

    if (!Number.isInteger(parsedQty) || parsedQty <= 0) {
        const error = new Error("qty debe ser un número entero mayor a 0");
        error.statusCode = 400;
        throw error;
    }

    if (parsedQty > MOCK_LIMITS.MAX_ITEMS) {
        const error = new Error(`qty no puede superar ${MOCK_LIMITS.MAX_ITEMS}`);
        error.statusCode = 400;
        throw error;
    }

    return parsedQty;
};

const hashUsers = async (users) => {
    return Promise.all(
        users.map(async (user) => ({
            ...user,
            password: await bcrypt.hash(user.password, SALT_ROUNDS)
        }))
    );
};

export const mocksService = {

    // ---------- GET: datos simulados, sin guardar ----------

    getMockUsers: (qty, role = USER_ROLES.CUSTOMER) => {
        const validQty = validateQty(qty);
        return generateMockUsers(validQty, role);
    },

    getMockDrivers: (qty) => {
        const validQty = validateQty(qty);
        return generateMockDrivers(validQty);
    },

    getMockOrders: (qty) => {
        const validQty = validateQty(qty);
        return generateMockOrders(validQty);
    },

    getMockDeliveries: (qty) => {
        const validQty = validateQty(qty);
        return generateMockDeliveries(validQty);
    },

    // ---------- POST /seed: genera e inserta en MongoDB ----------

    seedUsers: async (qty, role = USER_ROLES.CUSTOMER) => {
        const validQty = validateQty(qty);
        const mockUsers = generateMockUsers(validQty, role);
        const usersWithHashedPasswords = await hashUsers(mockUsers);

        const inserted = await usersRepository.insertMany(usersWithHashedPasswords);
        return inserted.length;
    },

    seedDrivers: async (qty) => {
        const validQty = validateQty(qty);
        const mockDrivers = generateMockDrivers(validQty);
        const driversWithHashedPasswords = await hashUsers(mockDrivers);

        const inserted = await usersRepository.insertMany(driversWithHashedPasswords);
        return inserted.length;
    },

    /**
     * Si no hay ningún customer en la base, generamos algunos automáticamente
     * antes de crear los pedidos (para respetar la relación pedido ↔ usuario).
     */
    seedOrders: async (qty) => {
        const validQty = validateQty(qty);

        let customers = await usersRepository.getAll({ role: USER_ROLES.CUSTOMER });

        if (customers.length === 0) {
            const seededCount = await mocksService.seedUsers(3, USER_ROLES.CUSTOMER);
            customers = await usersRepository.getAll({ role: USER_ROLES.CUSTOMER });
            console.log(`[mocks] No había customers, se generaron ${seededCount} automáticamente`);
        }

        const customerIds = customers.map((customer) => customer._id);
        const mockOrders = generateMockOrders(validQty, customerIds);

        const inserted = await ordersRepository.insertMany(mockOrders);
        return inserted.length;
    },

    /**
     * Genera en cascada lo que falte: primero pedidos (que a su vez pueden
     * generar customers), después repartidores.
     */
    seedDeliveries: async (qty) => {
        const validQty = validateQty(qty);

        let orders = await ordersRepository.getAll();
        if (orders.length === 0) {
            const seededCount = await mocksService.seedOrders(3);
            orders = await ordersRepository.getAll();
            console.log(`[mocks] No había pedidos, se generaron ${seededCount} automáticamente`);
        }

        let drivers = await usersRepository.getAll({ role: USER_ROLES.DRIVER });
        if (drivers.length === 0) {
            const seededCount = await mocksService.seedDrivers(2);
            drivers = await usersRepository.getAll({ role: USER_ROLES.DRIVER });
            console.log(`[mocks] No había repartidores, se generaron ${seededCount} automáticamente`);
        }

        const orderIds = orders.map((order) => order._id);
        const driverIds = drivers.map((driver) => driver._id);
        const mockDeliveries = generateMockDeliveries(validQty, orderIds, driverIds);

        const inserted = await deliveriesRepository.insertMany(mockDeliveries);
        return inserted.length;
    }
};