export const ERROR_DICTIONARY = Object.freeze({

    // Usuarios

    USER_NOT_FOUND: {
        statusCode: 404,
        message: "El usuario solicitado no existe"
    },
    USER_ALREADY_EXISTS: {
        statusCode: 409,
        message: "Ya existe un usuario registrado con ese email"
    },

    // Productos

    PRODUCT_NOT_FOUND: {
        statusCode: 404,
        message: "El producto solicitado no existe"
    },

    // Mocks / datos de prueba

    INVALID_MOCK_AMOUNT: {
        statusCode: 400,
        message: "La cantidad de registros a generar debe ser un número entero positivo"
    },
    INVALID_MOCK_ENTITY: {
        statusCode: 400,
        message: "La entidad solicitada para generar datos de prueba no es válida"
    },
    MOCK_GENERATION_ERROR: {
        statusCode: 500,
        message: "Ocurrió un error al generar o insertar los datos de prueba"
    },

    // Validación de datos

    VALIDATION_ERROR: {
        statusCode: 400,
        message: "Los datos enviados no son válidos"
    },

    // Rutas y servidor

    ROUTE_NOT_FOUND: {
        statusCode: 404,
        message: "La ruta solicitada no existe"
    },
    INTERNAL_SERVER_ERROR: {
        statusCode: 500,
        message: "Ocurrió un error inesperado en el servidor"
    }
});