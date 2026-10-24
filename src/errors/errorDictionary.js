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
    INVALID_USER_ROLE: {
        statusCode: 400,
        message: "El usuario indicado no tiene el rol requerido para esta operación"
    },

    // Productos

    PRODUCT_NOT_FOUND: {
        statusCode: 404,
        message: "El producto solicitado no existe"
    },

    // Pedidos

    ORDER_NOT_FOUND: {
        statusCode: 404,
        message: "El pedido solicitado no existe"
    },
    ORDER_ITEMS_REQUIRED: {
        statusCode: 400,
        message: "El pedido debe incluir al menos un item"
    },
    INVALID_ORDER_STATUS: {
        statusCode: 400,
        message: "El estado del pedido especificado no es válido"
    },
    ORDER_ALREADY_DELIVERED: {
        statusCode: 409,
        message: "El pedido ya ha sido entregado y no puede ser modificado"
    },

    // Entregas

    DELIVERY_NOT_FOUND: {
        statusCode: 404,
        message: "La entrega solicitada no existe"
    },
    INVALID_DELIVERY_STATUS: {
        statusCode: 400,
        message: "El estado de la entrega especificado no es válido"
    },
    DRIVER_NOT_AVAILABLE: {
        statusCode: 409,
        message: "El repartidor no está disponible para tomar una nueva entrega"
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
    INVALID_ID: {
        statusCode: 400,
        message: "El identificador enviado no tiene un formato válido"
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