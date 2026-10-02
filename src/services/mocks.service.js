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
import { CustomError } from "../errors/CustomError.js";

// Mock data generation service

const SALT_ROUNDS = 10;

const validateQty = (qty) => {
    const parsedQty = Number(qty);

    if (!Number.isInteger(parsedQty) || parsedQty <= 0) {
        throw new CustomError("INVALID_MOCK_AMOUNT", `qty recibido: "${qty}"`);
    }

    if (parsedQty > MOCK_LIMITS.MAX_ITEMS) {
        throw new CustomError("INVALID_MOCK_AMOUNT", `qty no puede superar ${MOCK_LIMITS.MAX_ITEMS} (recibido: ${qty})`);
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

const insertOrThrow = async (insertFn) => {
    try {
        return await insertFn();
    } catch (error) {
        console.error("❌ Error al insertar datos de mock en MongoDB:", error);
        throw new CustomError("MOCK_GENERATION_ERROR");
    }
};

export const mocksService = {

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

    seedUsers: async (qty, role = USER_ROLES.CUSTOMER) => {
        const validQty = validateQty(qty);
        const mockUsers = generateMockUsers(validQty, role);
        const usersWithHashedPasswords = await hashUsers(mockUsers);

        const inserted = await insertOrThrow(() => usersRepository.insertMany(usersWithHashedPasswords));
        return inserted.length;
    },

    seedDrivers: async (qty) => {
        const validQty = validateQty(qty);
        const mockDrivers = generateMockDrivers(validQty);
        const driversWithHashedPasswords = await hashUsers(mockDrivers);

        const inserted = await insertOrThrow(() => usersRepository.insertMany(driversWithHashedPasswords));
        return inserted.length;
    },

    seedOrders: async (qty) => {
        const validQty = validateQty(qty);

        let customers = await usersRepository.getAll({ role: USER_ROLES.CUSTOMER });

        if (customers.length === 0) {
            await mocksService.seedUsers(3, USER_ROLES.CUSTOMER);
            customers = await usersRepository.getAll({ role: USER_ROLES.CUSTOMER });
        }

        const customerIds = customers.map((customer) => customer._id);
        const mockOrders = generateMockOrders(validQty, customerIds);

        const inserted = await insertOrThrow(() => ordersRepository.insertMany(mockOrders));
        return inserted.length;
    },

    seedDeliveries: async (qty) => {
        const validQty = validateQty(qty);

        let orders = await ordersRepository.getAll();
        if (orders.length === 0) {
            await mocksService.seedOrders(3);
            orders = await ordersRepository.getAll();
        }

        let drivers = await usersRepository.getAll({ role: USER_ROLES.DRIVER });
        if (drivers.length === 0) {
            await mocksService.seedDrivers(2);
            drivers = await usersRepository.getAll({ role: USER_ROLES.DRIVER });
        }

        const orderIds = orders.map((order) => order._id);
        const driverIds = drivers.map((driver) => driver._id);
        const mockDeliveries = generateMockDeliveries(validQty, orderIds, driverIds);

        const inserted = await insertOrThrow(() => deliveriesRepository.insertMany(mockDeliveries));
        return inserted.length;
    }
};