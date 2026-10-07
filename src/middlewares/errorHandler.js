import { CustomError } from "../errors/CustomError.js";
import { config } from "../config/env.config.js";
import logger from "../config/logger.config.js";

// Controlador para manejar errores en la aplicación Express.

export const errorHandler = (error, req, res, next) => {

    if (error instanceof CustomError) {
        const logLine = `${error.code} - ${error.message} - ${req.method} ${req.originalUrl}`;

       // Loguear el error según su gravedad (statusCode)

        if (error.statusCode >= 500) {
            logger.error(logLine);
        } else {
            logger.warning(logLine);
        }

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

    // Si el error no es una instancia de CustomError, se trata como un error inesperado.

    logger.error(`Error inesperado - ${req.method} ${req.originalUrl} - ${error.message}`, {
        stack: error.stack
    });

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