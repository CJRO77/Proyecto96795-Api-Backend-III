import express from "express";
import productsRouter from "./routes/products.routes.js";
import usersRouter from "./routes/users.routes.js";
import mocksRouter from "./routes/mocks.routes.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { errorHandler } from "./middlewares/errorHandler.js";

// Configuración de la aplicación Express

const app = express();

app.use(express.json());

app.use("/api/products", productsRouter);
app.use("/api/users", usersRouter);
app.use("/api/mocks", mocksRouter);

// Middleware de manejo de rutas no encontradas y errores globales

app.use(notFoundHandler);
app.use(errorHandler);

export default app;