import express from "express";
import { getHealth } from "../controllers/health.controller.js";

// Ruta para verificar el estado de salud de la API.

const router = express.Router();

router.get("/", getHealth);

export default router;