import DeliveryModel from "../models/delivery.model.js";

// Repositorio de entregas


export const deliveriesRepository = {
    getAll: async (filters = {}) => {
        return await DeliveryModel.find(filters);
    },
    getById: async (id) => {
        return await DeliveryModel.findById(id);
    },
    create: async (deliveryData) => {
        return await DeliveryModel.create(deliveryData);
    },
    insertMany: async (deliveriesData) => {
        return await DeliveryModel.insertMany(deliveriesData);
    }
};