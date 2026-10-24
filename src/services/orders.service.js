import { ordersRepository } from "../repositories/orders.repository.js";
import { usersRepository } from "../repositories/users.repository.js";
import { ORDER_STATUS, DELIVERY_PRIORITY } from "../constants/index.js";
import { CustomError } from "../errors/CustomError.js";
import logger from "../config/logger.config.js";

const isValidOrderStatus = (status) => Object.values(ORDER_STATUS).includes(status);

// Valida que el array de items cumpla con las reglas de negocio: no vacío, cada item tiene nombre, cantidad y precio válidos.

const validateItems = (items) => {
    if (!Array.isArray(items) || items.length === 0) {
        throw new CustomError("ORDER_ITEMS_REQUIRED");
    }

    items.forEach((item, index) => {
        const { name, quantity, price } = item ?? {};

        if (!name || typeof name !== "string") {
            throw new CustomError("VALIDATION_ERROR", `items[${index}].name es obligatorio`);
        }

        if (!Number.isInteger(quantity) || quantity < 1) {
            throw new CustomError("VALIDATION_ERROR", `items[${index}].quantity debe ser un entero mayor o igual a 1`);
        }

        if (typeof price !== "number" || Number.isNaN(price) || price < 0) {
            throw new CustomError("VALIDATION_ERROR", `items[${index}].price debe ser un número mayor o igual a 0`);
        }
    });
};

export const ordersService = {

    getAllOrders: async ({ status } = {}) => {
        const filters = {};

        if (status !== undefined) {
            if (!isValidOrderStatus(status)) {
                throw new CustomError(
                    "INVALID_ORDER_STATUS",
                    `status recibido: "${status}". Valores permitidos: ${Object.values(ORDER_STATUS).join(", ")}`
                );
            }
            filters.status = status;
        }

        return await ordersRepository.getAll(filters);
    },

    getOrderById: async (id) => {
        const order = await ordersRepository.getById(id);

        if (!order) {
            throw new CustomError("ORDER_NOT_FOUND", `id: ${id}`);
        }

        return order;
    },

    createOrder: async (orderData) => {
        const { customer, items, deliveryAddress, priority } = orderData;

        if (!customer || !deliveryAddress) {
            throw new CustomError("VALIDATION_ERROR", "customer y deliveryAddress son obligatorios");
        }

        validateItems(items);

        if (priority !== undefined && !Object.values(DELIVERY_PRIORITY).includes(priority)) {
            throw new CustomError(
                "VALIDATION_ERROR",
                `priority recibido: "${priority}". Valores permitidos: ${Object.values(DELIVERY_PRIORITY).join(", ")}`
            );
        }

        // Regla de negocio: un pedido siempre pertenece a un usuario que existe.

        const existingCustomer = await usersRepository.getById(customer);
        if (!existingCustomer) {
            throw new CustomError("USER_NOT_FOUND", `customer: ${customer}`);
        }

        // El total nunca lo manda el cliente: lo calcula el service.

        const total = items.reduce((acc, item) => acc + item.quantity * item.price, 0);

        const newOrder = await ordersRepository.create({
            customer,
            items,
            deliveryAddress,
            total,
            status: ORDER_STATUS.CREATED,
            priority: priority ?? DELIVERY_PRIORITY.NORMAL
        });

        logger.info(`Pedido creado (id: ${newOrder._id}, total: ${total})`);

        return newOrder;
    },

    updateOrderStatus: async (id, status) => {
        if (!isValidOrderStatus(status)) {
            throw new CustomError(
                "INVALID_ORDER_STATUS",
                `status recibido: "${status}". Valores permitidos: ${Object.values(ORDER_STATUS).join(", ")}`
            );
        }

        const order = await ordersService.getOrderById(id);

        // Regla de negocio: un pedido entregado queda cerrado.
        
        if (order.status === ORDER_STATUS.DELIVERED) {
            throw new CustomError("ORDER_ALREADY_DELIVERED", `id: ${id}`);
        }

        const updatedOrder = await ordersRepository.update(id, { status });
        logger.info(`Pedido ${id}: estado ${order.status} → ${status}`);

        return updatedOrder;
    }
};