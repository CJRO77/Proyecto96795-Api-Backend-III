import express from "express";
import { uploadUserDocument as uploadUserDocumentMiddleware } from "../config/multer.config.js";

import {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    uploadUserDocument as uploadUserDocumentController
} from "../controllers/users.controller.js";

// rutas de usuarios

const router = express.Router();

router.get("/", getUsers);
router.get("/:id", getUserById);
router.post("/", createUser);
router.put("/:id", updateUser);
router.post("/:id/documents", uploadUserDocumentMiddleware, uploadUserDocumentController);
router.delete("/:id", deleteUser);

export default router;