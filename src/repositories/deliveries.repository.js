
import DeliveryModel from "../models/delivery.model.js";

// Proyección por defecto para excluir campos innecesarios en las respuestas de los endpoints de entregas.

const DEFAULT_PROJECTION = "-__v";

export const deliveriesRepository = {

    getAll: async (filters = {}) => {
        return await DeliveryModel.find(filters)
            .select(DEFAULT_PROJECTION)
            .sort({ createdAt: -1 });
    },

    getAllPaginated: async (filters = {}, page = 1, limit = 10) => {
        const skip = (page - 1) * limit;

        const deliveries = await DeliveryModel.find(filters)
            .select(DEFAULT_PROJECTION)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        const totalDeliveries = await DeliveryModel.countDocuments(filters);

        return {
            deliveries,
            totalDeliveries
        };
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
            returnDocument: "after",
            runValidators: true
        }).select(DEFAULT_PROJECTION);
    }
};
