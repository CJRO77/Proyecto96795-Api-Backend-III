import bcrypt from "bcryptjs";
import { usersRepository } from "../repositories/users.repository.js";
import { USER_ROLES, USER_DOCUMENT_TYPES } from "../constants/index.js";
import { CustomError } from "../errors/CustomError.js";
import logger from "../config/logger.config.js";
import { unlink } from "node:fs/promises";
import path from "node:path";

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

 // Función para crear un nuevo usuario con validación de datos y manejo de errores.

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

// Función para actualizar un usuario existente con validación de datos y manejo de errores.

    updateUser: async (id, updateData) => {
        await usersService.getUserById(id);

        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, SALT_ROUNDS);
        }

        const updatedUser = await usersRepository.update(id, updateData);
        logger.info(`Usuario actualizado (id: ${id})`);

        return updatedUser;
    },

 // Función para asociar un documento a un usuario existente con validación de datos y manejo de errores.


    addUserDocument: async (id, file, type) => {

        if (!file) {
        throw new CustomError("FILE_REQUIRED");
        }

        if (!Object.values(USER_DOCUMENT_TYPES).includes(type)) {
        await unlink(file.path).catch(() => {});
        throw new CustomError("INVALID_DOCUMENT_TYPE");
       }

        try {

// Primero verificamos que exista el usuario.

        await usersService.getUserById(id);

        // Preparamos los datos que guardaremos en MongoDB.

        const documentData = {
            originalName: file.originalname,
            fileName: file.filename,
            path: path.relative(process.cwd(), file.path).split(path.sep).join("/"),
            mimeType: file.mimetype,
            size: file.size,
            type,
            uploadedAt: new Date()
        };

 // Guardamos los metadatos en el usuario.

        const updatedUser = await usersRepository.addDocument(
            id,
            documentData
        );

        if (!updatedUser) {
            throw new CustomError("USER_NOT_FOUND");
        }

        logger.info(`Documento asociado al usuario (id: ${id})`);

        return updatedUser;

    } catch (error) {

 // Si falla la asociación, eliminamos el archivo físico.

        await unlink(file.path).catch(() => {});

        if (error instanceof CustomError) {
            throw error;
        }

        logger.error(`Error al asociar documento al usuario (id: ${id}): ${error.message}`);

        throw new CustomError("UPLOAD_ERROR");
    }
},

// Función para eliminar un usuario existente con validación de datos y manejo de errores.

    deleteUser: async (id) => {
        await usersService.getUserById(id);

        const deletedUser = await usersRepository.delete(id);
        logger.info(`Usuario eliminado (id: ${id})`);

        return deletedUser;
    }
};