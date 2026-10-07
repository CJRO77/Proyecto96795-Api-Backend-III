import logger from "../config/logger.config.js";

// Middleware para registrar las solicitudes HTTP entrantes usando Winston.

export const httpLogger = (req, res, next) => {
    logger.http(`${req.method} ${req.originalUrl}`);
    next();
};