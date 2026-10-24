import express from "express";
import swaggerUi from "swagger-ui-express";
import productsRouter from "./routes/products.routes.js";
import usersRouter from "./routes/users.routes.js";
import ordersRouter from "./routes/orders.routes.js";
import deliveriesRouter from "./routes/deliveries.routes.js";
import mocksRouter from "./routes/mocks.routes.js";
import loggerTestRouter from "./routes/logger.routes.js";
import { swaggerSpecs } from "./docs/swagger.config.js";
import { httpLogger } from "./middlewares/httpLogger.js";
import { normalizeBody } from "./middlewares/normalizeBody.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { errorHandler } from "./middlewares/errorHandler.js";

// Configuración de la aplicación Express.

const app = express();

app.use(express.json());
app.use(normalizeBody);
app.use(httpLogger);

app.use("/api/products", productsRouter);
app.use("/api/users", usersRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/deliveries", deliveriesRouter);
app.use("/api/mocks", mocksRouter);
app.use("/api/logger-test", loggerTestRouter);

// Documentación interactiva (Swagger UI). Va antes de los middlewares de error.

app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

app.use(notFoundHandler);
app.use(errorHandler);

export default app;