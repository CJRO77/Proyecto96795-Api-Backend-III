import { config } from "./config/env.config.js";
import { connectDB } from "./config/database.config.js";
import app from "./app.js";
import logger from "./config/logger.config.js";

// Función para iniciar el servidor y conectar a la base de datos.

const startServer = async () => {
    await connectDB();

    app.listen(config.port, () => {
        logger.info(`Servidor ShipNow escuchando en el puerto ${config.port}`);
    });
};

startServer();
