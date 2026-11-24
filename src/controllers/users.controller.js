import { usersService } from "../services/users.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Controladores para manejar las solicitudes relacionadas con los usuarios. 
// Cada función está envuelta en asyncHandler para capturar errores de manera uniforme y pasarlos al middleware de manejo de errores.

export const getUsers = asyncHandler(async (req, res) => {
    const users = await usersService.getAllUsers({
        page: req.query.page === undefined ? 1 : Number(req.query.page),
        limit: req.query.limit === undefined ? 10 : Number(req.query.limit)
    });

    res.status(200).json({
        status: "success",
        payload: users.users,
        pagination: users.pagination
    });
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


export const uploadUserDocument = asyncHandler(async (req, res) => {

    const updatedUser = await usersService.addUserDocument(
        req.params.id,
        req.file,
        req.body.type
    );

    res.status(201).json({
        status: "success",
        message: "Documento cargado y asociado correctamente",
        payload: updatedUser
    });
});
