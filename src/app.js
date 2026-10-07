import express from "express";
import productsRouter from "./routes/products.routes.js";
import usersRouter from "./routes/users.routes.js";
import mocksRouter from "./routes/mocks.routes.js";
import loggerTestRouter from "./routes/logger.routes.js";
import { httpLogger } from "./middlewares/httpLogger.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { errorHandler } from "./middlewares/errorHandler.js";

// Configuración de la aplicación Express y registro de middlewares y rutas.

const app = express();

app.use(express.json());
app.use(httpLogger);

app.use("/api/products", productsRouter);
app.use("/api/users", usersRouter);
app.use("/api/mocks", mocksRouter);
app.use("/api/logger-test", loggerTestRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;