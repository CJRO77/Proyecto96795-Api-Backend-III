import UserModel from "../models/user.model.js";

// Proyección por defecto para excluir campos sensibles o innecesarios en las respuestas de los endpoints de usuarios.

const DEFAULT_PROJECTION = "-password -__v";

export const usersRepository = {

    getAll: async (filters = {}) => {
        return await UserModel.find(filters).select(DEFAULT_PROJECTION);
    },

    getById: async (id) => {
        return await UserModel.findById(id).select(DEFAULT_PROJECTION);
    },

    getByEmail: async (email) => {
        return await UserModel.findOne({ email });
    },

    insertMany: async (usersData) => {
        return await UserModel.insertMany(usersData);
    },

    create: async (userData) => {
        const created = await UserModel.create(userData);
        return created.toObject({ versionKey: false });
    },

    update: async (id, updateData) => {
        return await UserModel.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        }).select(DEFAULT_PROJECTION);
    },

    delete: async (id) => {
        return await UserModel.findByIdAndDelete(id);
    }
};