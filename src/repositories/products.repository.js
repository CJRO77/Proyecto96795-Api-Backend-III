import ProductModel from "../models/product.model.js";

// Proyección por defecto para excluir el campo __v de los documentos de producto

const DEFAULT_PROJECTION = "-__v";

export const productsRepository = {

    getAll: async (filters = {}) => {
        return await ProductModel.find(filters).select(DEFAULT_PROJECTION);
    },

    getById: async (id) => {
        return await ProductModel.findById(id).select(DEFAULT_PROJECTION);
    },

    create: async (productData) => {
        return await ProductModel.create(productData);
    },

    update: async (id, updateData) => {
        return await ProductModel.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        }).select(DEFAULT_PROJECTION);
    },

    delete: async (id) => {
        return await ProductModel.findByIdAndDelete(id);
    }
};