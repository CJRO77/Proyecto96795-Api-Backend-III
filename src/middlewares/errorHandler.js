import { CustomError } from "../errors/CustomError.js";
import { config } from "../config/env.config.js";
import logger from "../config/logger.config.js";

// Normaliza ciertos errores conocidos para que sean manejados de manera uniforme.


const normalizeError = (error) => {
    if (error.name === "CastError") {
        return new CustomError("INVALID_ID", `${error.path}: "${error.value}"`);
    }

    if (error.type === "entity.parse.failed") {
        return new CustomError("VALIDATION_ERROR", "El body de la petición no es un JSON válido");
    }

    return error;
};

export const errorHandler = (error, req, res, next) => {
    const handledError = normalizeError(error);

    // Error conocido: se responde con el código y mensaje correspondiente, y se registra un log de advertencia o error según corresponda.

    if (handledError instanceof CustomError) {
        const logLine = `${handledError.code} - ${handledError.message} - ${req.method} ${req.originalUrl}`;

        
        if (handledError.statusCode >= 500) {
            logger.error(logLine);
        } else {
            logger.warning(logLine);
        }

        const response = {
            status: "error",
            error: handledError.code,
            message: handledError.message
        };

        if (config.nodeEnv !== "production" && handledError.details) {
            response.details = handledError.details;
        }

        return res.status(handledError.statusCode).json(response);
    }

    // Error inesperado: queda registrado completo (con stack trace) para investigarlo.


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