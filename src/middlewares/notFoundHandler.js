import logger from "../config/logger.config.js";

// Controlador para manejar rutas no encontradas (404).

export const notFoundHandler = (req, res) => {
    logger.warning(`Ruta no encontrada: ${req.method} ${req.originalUrl}`);

    res.status(404).json({
        status: "error",
        error: "ROUTE_NOT_FOUND",
        message: "La ruta solicitada no existe"
    });
};