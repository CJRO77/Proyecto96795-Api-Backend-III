import UserModel from "../models/user.model.js";

// Proyección por defecto para excluir campos sensibles o innecesarios en las respuestas de los endpoints de usuarios.

const DEFAULT_PROJECTION = "-password -__v";

export const usersRepository = {

    getAll: async (filters = {}) => {
        return await UserModel.find(filters).select(DEFAULT_PROJECTION);
    },

    getAllPaginated: async (filters = {}, page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    const users = await UserModel.find(filters)
        .select(DEFAULT_PROJECTION)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

    const totalUsers = await UserModel.countDocuments(filters);

    return {
        users,
        totalUsers
    };
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
            returnDocument: "after",
            runValidators: true
        }).select(DEFAULT_PROJECTION);
    },

    delete: async (id) => {
        return await UserModel.findByIdAndDelete(id);
    },

    addDocument: async (id, documentData) =>
        await UserModel.findByIdAndUpdate(
              id,
        {
            $push: {
                documents: documentData
            }
        },
        {
            returnDocument: "after",
            runValidators: true
        }
    ).select(DEFAULT_PROJECTION)

};

