import express from "express";
import { loggerTest } from "../controllers/logger.controller.js";

// Rutas para probar los 6 niveles de log de Winston.

const router = express.Router();

router.get("/", loggerTest);

export default router;