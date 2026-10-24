import { deliveriesRepository } from "../repositories/deliveries.repository.js";
import { ordersRepository } from "../repositories/orders.repository.js";
import { usersRepository } from "../repositories/users.repository.js";
import { DELIVERY_STATUS, USER_ROLES } from "../constants/index.js";
import { CustomError } from "../errors/CustomError.js";
import logger from "../config/logger.config.js";

// Valida que el estado de la entrega sea uno de los permitidos.

const isValidDeliveryStatus = (status) => Object.values(DELIVERY_STATUS).includes(status);

export const deliveriesService = {

    getAllDeliveries: async ({ status } = {}) => {
        const filters = {};

        if (status !== undefined) {
            if (!isValidDeliveryStatus(status)) {
                throw new CustomError(
                    "INVALID_DELIVERY_STATUS",
                    `status recibido: "${status}". Valores permitidos: ${Object.values(DELIVERY_STATUS).join(", ")}`
                );
            }
            filters.status = status;
        }

        return await deliveriesRepository.getAll(filters);
    },

    getDeliveryById: async (id) => {
        const delivery = await deliveriesRepository.getById(id);

        if (!delivery) {
            throw new CustomError("DELIVERY_NOT_FOUND", `id: ${id}`);
        }

        return delivery;
    },

    createDelivery: async ({ order, driver } = {}) => {
        if (!order) {
            throw new CustomError("VALIDATION_ERROR", "order es obligatorio");
        }

        // Regla de negocio: una entrega siempre pertenece a un pedido que existe.

        const existingOrder = await ordersRepository.getById(order);
        if (!existingOrder) {
            throw new CustomError("ORDER_NOT_FOUND", `order: ${order}`);
        }

        let status = DELIVERY_STATUS.PENDING;

        // El repartidor es opcional. Si viene, tiene que existir, tener rol DRIVER
        // y estar disponible; recién ahí la entrega nace asignada.
        
        if (driver) {
            const existingDriver = await usersRepository.getById(driver);

            if (!existingDriver) {
                throw new CustomError("USER_NOT_FOUND", `driver: ${driver}`);
            }

            if (existingDriver.role !== USER_ROLES.DRIVER) {
                throw new CustomError("INVALID_USER_ROLE", `driver: ${driver} (rol: ${existingDriver.role})`);
            }

            if (existingDriver.isAvailable === false) {
                throw new CustomError("DRIVER_NOT_AVAILABLE", `driver: ${driver}`);
            }

            status = DELIVERY_STATUS.ASSIGNED;
        }

        const newDelivery = await deliveriesRepository.create({
            order,
            driver: driver ?? null,
            status
        });

        logger.info(`Entrega creada (id: ${newDelivery._id}, estado: ${status})`);

        return newDelivery;
    },

    updateDeliveryStatus: async (id, status) => {
        if (!isValidDeliveryStatus(status)) {
            throw new CustomError(
                "INVALID_DELIVERY_STATUS",
                `status recibido: "${status}". Valores permitidos: ${Object.values(DELIVERY_STATUS).join(", ")}`
            );
        }

        const delivery = await deliveriesService.getDeliveryById(id);

        const updatedDelivery = await deliveriesRepository.update(id, { status });
        logger.info(`Entrega ${id}: estado ${delivery.status} → ${status}`);

        return updatedDelivery;
    }
};