import swaggerJSDoc from "swagger-jsdoc";
import { config } from "../config/env.config.js";

// Configuración de Swagger para la documentación de la API.

const swaggerOptions = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "ShipNow API",
            version: "1.0.0",
            description:
                "API de ShipNow, plataforma de gestión de operaciones para una empresa de logística. " +
                "Permite administrar usuarios, productos, pedidos y entregas, además de herramientas " +
                "internas de desarrollo (generación de datos de prueba y validación del logger). " +
                "Todas las respuestas exitosas usan la forma { status: \"success\", payload } y todos " +
                "los errores usan { status: \"error\", error, message }. Cualquier endpoint que reciba un body " +
                "responde 400 VALIDATION_ERROR si el body no es un JSON válido."
        },
        servers: [
            {
                // El puerto sale de la configuración validada, no se escribe a mano.

                
                url: `http://localhost:${config.port}`,
                description: "Servidor local"
            }
        ],
        tags: [

            // Cada tag representa un grupo de endpoints relacionados, y se usa para organizar la documentación.
            
            { name: "Users", description: "Registro y administración de usuarios" },
            { name: "Products", description: "Catálogo de productos" },
            { name: "Orders", description: "Pedidos de los clientes y su estado" },
            { name: "Deliveries", description: "Entregas asociadas a pedidos y a repartidores" },
            { name: "Mocks", description: "Herramienta de desarrollo: generación de datos de prueba" },
            { name: "Logger", description: "Herramienta de desarrollo: validación del sistema de logs" }
        ]
    },
    apis: ["./src/docs/**/*.yaml"]
};

export const swaggerSpecs = swaggerJSDoc(swaggerOptions);