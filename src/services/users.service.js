import bcrypt from "bcryptjs";
import { usersRepository } from "../repositories/users.repository.js";
import { USER_ROLES } from "../constants/index.js";
import { CustomError } from "../errors/CustomError.js";
import logger from "../config/logger.config.js";

// Controlador para manejar la lógica de negocio relacionada con los usuarios.

const SALT_ROUNDS = 10;

export const usersService = {

    getAllUsers: async () => {
        return await usersRepository.getAll();
    },

    getUserById: async (id) => {
        const user = await usersRepository.getById(id);

        if (!user) {
            throw new CustomError("USER_NOT_FOUND", `id: ${id}`);
        }

        return user;
    },

    createUser: async (userData) => {
        const { firstName, lastName, email, password } = userData;

        if (!firstName || !lastName || !email || !password) {
            throw new CustomError("VALIDATION_ERROR", "firstName, lastName, email y password son obligatorios");
        }

        const existingUser = await usersRepository.getByEmail(email);

        if (existingUser) {
            throw new CustomError("USER_ALREADY_EXISTS", `email: ${email}`);
        }

        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // nadie se autoasigna ADMIN al registrarse
        
        const newUser = await usersRepository.create({
            firstName,
            lastName,
            email,
            password: hashedPassword,
            role: USER_ROLES.USER
        });

        newUser.password = undefined;
        logger.info(`Usuario registrado: ${newUser.email}`);

        return newUser;
    },

    updateUser: async (id, updateData) => {
        await usersService.getUserById(id);

        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, SALT_ROUNDS);
        }

        const updatedUser = await usersRepository.update(id, updateData);
        logger.info(`Usuario actualizado (id: ${id})`);

        return updatedUser;
    },

    deleteUser: async (id) => {
        await usersService.getUserById(id);

        const deletedUser = await usersRepository.delete(id);
        logger.info(`Usuario eliminado (id: ${id})`);

        return deletedUser;
    }
};