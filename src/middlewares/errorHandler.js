import { CustomError } from "../errors/CustomError.js";
import { config } from "../config/env.config.js";

export const errorHandler = (error, req, res, next) => {

    // Caso esperado: un error de dominio que nosotros mismos generamos.

    if (error instanceof CustomError) {
        const response = {
            status: "error",
            error: error.code,
            message: error.message
        };

        if (config.nodeEnv !== "production" && error.details) {
            response.details = error.details;
        }

        return res.status(error.statusCode).json(response);
    }

    // Caso inesperado: un error técnico que no contemplamos (bug, Mongo caído, etc.).
    
    console.error("❌ Error inesperado:", error);

    const response = {
        status: "error",
        error: "INTERNAL_SERVER_ERROR",
        message: "Ocurrió un error inesperado en el servidor"
    };

    if (config.nodeEnv !== "production") {
        response.details = error.message;
    }

    res.status(500).json(response);
};