
import { unlink } from "node:fs/promises";
import path from "node:path";
import { deliveriesRepository } from "../repositories/deliveries.repository.js";
import { ordersRepository } from "../repositories/orders.repository.js";
import { usersRepository } from "../repositories/users.repository.js";
import { DELIVERY_STATUS, USER_ROLES } from "../constants/index.js";
import { CustomError } from "../errors/CustomError.js";
import logger from "../config/logger.config.js";

// Valida que el estado de la entrega sea uno de los permitidos.

const isValidDeliveryStatus = (status) =>
    Object.values(DELIVERY_STATUS).includes(status);

export const deliveriesService = {


    getAllDeliveries: async ({ status, page = 1, limit = 10 } = {}) => {
        const filters = {};

        // Validar que page sea un número entero mayor o igual a 1.

        if (!Number.isInteger(page) || page < 1) {
            throw new CustomError(
                "VALIDATION_ERROR",
                "page debe ser un entero mayor o igual a 1"
            );
        }

        // Validar que limit sea un número entero mayor o igual a 1.

        if (!Number.isInteger(limit) || limit < 1) {
            throw new CustomError(
                "VALIDATION_ERROR",
                "limit debe ser un entero mayor o igual a 1"
            );
        }

        // Evitar que se soliciten demasiadas entregas en una sola consulta.

        if (limit > 100) {
            throw new CustomError(
                "VALIDATION_ERROR",
                "limit no puede ser mayor a 100"
            );
        }

        // Mantener la validación del filtro por estado.

        if (status !== undefined) {
            if (!isValidDeliveryStatus(status)) {
                throw new CustomError(
                    "INVALID_DELIVERY_STATUS",
                    `status recibido: "${status}". Valores permitidos: ${Object.values(DELIVERY_STATUS).join(", ")}`
                );
            }

            filters.status = status;
        }

        const result = await deliveriesRepository.getAllPaginated(
            filters,
            page,
            limit
        );

        const totalPages = Math.ceil(result.totalDeliveries / limit);

        return {
            deliveries: result.deliveries,
            pagination: {
                page,
                limit,
                totalPages,
                totalDeliveries: result.totalDeliveries
            }
        };
    },

    getDeliveryById: async (id) => {
        const delivery = await deliveriesRepository.getById(id);

        // Validar que la entrega exista.

        if (!delivery) {
            throw new CustomError("DELIVERY_NOT_FOUND", `id: ${id}`);
        }

        return delivery;
    },

    createDelivery: async ({ order, driver } = {}) => {
        if (!order) {
            throw new CustomError("VALIDATION_ERROR", "order es obligatorio");
        }

// Una entrega siempre pertenece a un pedido existente.

        const existingOrder = await ordersRepository.getById(order);

        if (!existingOrder) {
            throw new CustomError("ORDER_NOT_FOUND", `order: ${order}`);
        }

        let status = DELIVERY_STATUS.PENDING;

// El repartidor es opcional. Si viene, debe existir, tener rol DRIVER y estar disponible.

        if (driver) {
            const existingDriver = await usersRepository.getById(driver);

            if (!existingDriver) {
                throw new CustomError("USER_NOT_FOUND", `driver: ${driver}`);
            }

            if (existingDriver.role !== USER_ROLES.DRIVER) {
                throw new CustomError(
                    "INVALID_USER_ROLE",
                    `driver: ${driver} (rol: ${existingDriver.role})`
                );
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
    },

// Carga y asocia el comprobante a una entrega.

    addDeliveryProof: async (id, file) => {
        if (!file) {
            throw new CustomError("FILE_REQUIRED");
        }

        try {
            await deliveriesService.getDeliveryById(id);

            const proofData = {
                originalName: file.originalname,
                fileName: file.filename,
                path: path.relative(process.cwd(), file.path).split(path.sep).join("/"),
                mimeType: file.mimetype,
                size: file.size,
                uploadedAt: new Date()
            };

            const updatedDelivery = await deliveriesRepository.update(id, {
                proof: proofData
            });

            if (!updatedDelivery) {
                throw new CustomError("DELIVERY_NOT_FOUND");
            }

            logger.info(`Comprobante asociado a la entrega (id: ${id})`);

            return updatedDelivery;

        } catch (error) {
            await unlink(file.path).catch(() => {});

            if (error instanceof CustomError) {
                throw error;
            }

            logger.error(
                `Error al asociar comprobante a la entrega (id: ${id}): ${error.message}`
            );

            throw new CustomError("UPLOAD_ERROR");
        }
    }
};
