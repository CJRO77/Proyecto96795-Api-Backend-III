import { usersService } from "../services/users.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Controladores para manejar las solicitudes relacionadas con los usuarios. 
// Cada función está envuelta en asyncHandler para capturar errores de manera uniforme y pasarlos al middleware de manejo de errores.

export const getUsers = asyncHandler(async (req, res) => {
    const users = await usersService.getAllUsers();
    res.status(200).json({ status: "success", payload: users });
});

export const getUserById = asyncHandler(async (req, res) => {
    const user = await usersService.getUserById(req.params.id);
    res.status(200).json({ status: "success", payload: user });
});

export const createUser = asyncHandler(async (req, res) => {
    const newUser = await usersService.createUser(req.body);
    res.status(201).json({
        status: "success",
        message: "Usuario creado correctamente",
        payload: newUser
    });
});

export const updateUser = asyncHandler(async (req, res) => {
    const updatedUser = await usersService.updateUser(req.params.id, req.body);
    res.status(200).json({
        status: "success",
        message: "Usuario actualizado correctamente",
        payload: updatedUser
    });
});

export const deleteUser = asyncHandler(async (req, res) => {
    await usersService.deleteUser(req.params.id);
    res.status(200).json({ status: "success", message: "Usuario eliminado correctamente" });
});