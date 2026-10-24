import DeliveryModel from "../models/delivery.model.js";

// Proyección por defecto para excluir campos innecesarios en las respuestas de los endpoints de entregas.

const DEFAULT_PROJECTION = "-__v";

export const deliveriesRepository = {

    getAll: async (filters = {}) => {
        return await DeliveryModel.find(filters).select(DEFAULT_PROJECTION).sort({ createdAt: -1 });
    },

    getById: async (id) => {
        return await DeliveryModel.findById(id).select(DEFAULT_PROJECTION);
    },

   create: async (deliveryData) => {
        const created = await DeliveryModel.create(deliveryData);
        return created.toObject({ versionKey: false });
    },

    insertMany: async (deliveriesData) => {
        return await DeliveryModel.insertMany(deliveriesData);
    },

    update: async (id, updateData) => {
        return await DeliveryModel.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        }).select(DEFAULT_PROJECTION);
    }
};