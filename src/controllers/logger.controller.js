import logger from "../config/logger.config.js";

// Controlador para probar los 6 niveles de log de Winston. 


export const loggerTest = (req, res) => {
    logger.debug("Log de nivel debug - loggerTest");
    logger.http("Log de nivel http - loggerTest");
    logger.info("Log de nivel info - loggerTest");
    logger.warning("Log de nivel warning - loggerTest");
    logger.error("Log de nivel error - loggerTest");
    logger.fatal("Log de nivel fatal - loggerTest");

    res.status(200).json({
        status: "success",
        payload: { message: "Logs generados correctamente en los 6 niveles" }
    });
};