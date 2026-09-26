import OrderModel from "../models/order.model.js";

// Repositorio de pedidos

export const ordersRepository = {
    getAll: async (filters = {}) => {
        return await OrderModel.find(filters);
    },
    getById: async (id) => {
        return await OrderModel.findById(id);
    },
    create: async (orderData) => {
        return await OrderModel.create(orderData);
    },
    insertMany: async (ordersData) => {
        return await OrderModel.insertMany(ordersData);
    }
};