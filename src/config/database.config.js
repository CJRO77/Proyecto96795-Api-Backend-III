import mongoose from "mongoose";
import { config } from "./env.config.js";
import logger from "./logger.config.js";

// Controlador para conectar a la base de datos MongoDB usando Mongoose.

export const connectDB = async () => {
    try {
        await mongoose.connect(config.mongoUri);
        logger.info("Conexión a MongoDB establecida");
    } catch (error) {
        logger.fatal(`No se pudo conectar a MongoDB: ${error.message}`);
        process.exit(1);
    }
};