import mongoose from "mongoose";
import { config } from "../config/env.config.js";

// Controlador para verificar el estado de salud de la API y la conexión a MongoDB.

export const getHealth = (req, res) => {
    const isDatabaseConnected = mongoose.connection.readyState === 1;

    const healthStatus = {
        status: isDatabaseConnected ? "healthy" : "unhealthy",
        environment: config.nodeEnv,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: isDatabaseConnected ? "connected" : "disconnected"
    };

    return res.status(isDatabaseConnected ? 200 : 503).json(healthStatus);
};