import UserModel from "../models/user.model.js";

// Repositorio de usuarios

export const usersRepository = {

    getAll: async (filters = {}) => {
        return await UserModel.find(filters);
    },

    getById: async (id) => {
        return await UserModel.findById(id);
    },

    getByEmail: async (email) => {
        return await UserModel.findOne({ email });
    },

    insertMany: async (usersData) => {
        return await UserModel.insertMany(usersData);
    },

    create: async (userData) => {
        return await UserModel.create(userData);
    },

    update: async (id, updateData) => {
        return await UserModel.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        });
    },

    delete: async (id) => {
        return await UserModel.findByIdAndDelete(id);
    }
};
