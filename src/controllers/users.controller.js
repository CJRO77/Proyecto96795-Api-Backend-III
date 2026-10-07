import { usersService } from "../services/users.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Controlador de usuarios: recibe requests, llama a services y arma responses.

export const getUsers = asyncHandler(async (req, res) => {
    const users = await usersService.getAllUsers();
    res.status(200).json({ success: true, data: users });
});

export const getUserById = asyncHandler(async (req, res) => {
    const user = await usersService.getUserById(req.params.id);
    res.status(200).json({ success: true, data: user });
});

export const createUser = asyncHandler(async (req, res) => {
    const newUser = await usersService.createUser(req.body);
    res.status(201).json({
        success: true,
        message: "Usuario creado correctamente",
        data: newUser
    });
});

export const updateUser = asyncHandler(async (req, res) => {
    const updatedUser = await usersService.updateUser(req.params.id, req.body);
    res.status(200).json({
        success: true,
        message: "Usuario actualizado correctamente",
        data: updatedUser
    });
});

export const deleteUser = asyncHandler(async (req, res) => {
    await usersService.deleteUser(req.params.id);
    res.status(200).json({ success: true, message: "Usuario eliminado correctamente" });
});

