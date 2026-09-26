import express from "express";
import productsRouter from "./routes/products.routes.js";
import usersRouter from "./routes/users.routes.js";
import mocksRouter from "./routes/mocks.routes.js";

// Configuración de la aplicación Express

const app = express();

app.use(express.json());

app.use("/api/products", productsRouter);
app.use("/api/users", usersRouter);
app.use("/api/mocks", mocksRouter);

export default app;