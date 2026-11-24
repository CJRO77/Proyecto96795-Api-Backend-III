import swaggerJSDoc from "swagger-jsdoc";
import { config } from "../config/env.config.js";

// Configuración de Swagger para la documentación de la API.

// En producción se excluyen los archivos de documentación de herramientas internas.
// En desarrollo y test se cargan todos los archivos YAML.

const documentationFiles =
  config.nodeEnv === "production"
    ? [
        "./src/docs/users.yaml",
        "./src/docs/products.yaml",
        "./src/docs/orders.yaml",
        "./src/docs/deliveries.yaml",
        "./src/docs/health.yaml",
        "./src/docs/schemas.yaml",
      ]
    : ["./src/docs/**/*.yaml"];

const isProduction = config.nodeEnv === "production";

const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ShipNow API",
      version: "1.0.0",
      description:
        "API de ShipNow, plataforma de gestión de operaciones para una empresa de logística. " +
        "Permite administrar usuarios, productos, pedidos y entregas. " +
        'Las respuestas exitosas de los endpoints de negocio usan la forma { status: "success", payload }. ' +
        "El endpoint /health devuelve directamente el estado de salud, el entorno, el tiempo de actividad " +
        'y el estado de conexión con la base de datos. Los errores usan { status: "error", error, message }. ' +
        "Cualquier endpoint que reciba un body responde 400 VALIDATION_ERROR si el body no es un JSON válido.",
    },
    servers: [
      {
        // El puerto sale de la configuración validada, no se escribe a mano.

        url: `http://localhost:${config.port}`,
        description: "Servidor local",
      },
    ],
    tags: [
      { name: "Users", description: "Registro y administración de usuarios" },
      { name: "Products", description: "Catálogo de productos" },
      { name: "Orders", description: "Pedidos de los clientes y su estado" },
      {
        name: "Deliveries",
        description: "Entregas asociadas a pedidos y a repartidores",
      },
      { name: "Health", description: "Monitoreo y estado de salud de la API" },
      ...(!isProduction
        ? [
            {
              name: "Mocks",
              description:
                "Herramienta de desarrollo: generación de datos de prueba",
            },
            {
              name: "Logger",
              description:
                "Herramienta de desarrollo: validación del sistema de logs",
            },
          ]
        : []),
    ],
  },
  apis: documentationFiles,
};

export const swaggerSpecs = swaggerJSDoc(swaggerOptions);
