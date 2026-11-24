
import OrderModel from "../models/order.model.js";

// Proyección por defecto para excluir campos innecesarios en las respuestas de los endpoints de órdenes.

const DEFAULT_PROJECTION = "-__v";

export const ordersRepository = {

    getAll: async (filters = {}, page = 1, limit = 10) => {
        const skip = (page - 1) * limit;

        const orders = await OrderModel.find(filters)
            .select(DEFAULT_PROJECTION)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalOrders = await OrderModel.countDocuments(filters);

        return {
            orders,
            totalOrders
        };
    },

    getAllUnpaginated: async (filters = {}) => {
    return await OrderModel.find(filters)
        .select(DEFAULT_PROJECTION)
        .sort({ createdAt: -1 });
    },

    getById: async (id) => {
        return await OrderModel.findById(id).select(DEFAULT_PROJECTION);
    },

    create: async (orderData) => {
        const created = await OrderModel.create(orderData);
        return created.toObject({ versionKey: false });
    },

    insertMany: async (ordersData) => {
        return await OrderModel.insertMany(ordersData);
    },

    update: async (id, updateData) => {
        return await OrderModel.findByIdAndUpdate(id, updateData, {
            returnDocument: "after",
            runValidators: true
        }).select(DEFAULT_PROJECTION);
    }
};
