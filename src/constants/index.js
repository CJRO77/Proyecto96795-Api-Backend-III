// Configuración de constantes para el sistema

export const USER_ROLES = Object.freeze({
    ADMIN: "ADMIN",
    USER: "USER",
    CUSTOMER: "CUSTOMER",
    DRIVER: "DRIVER",
    STORE: "STORE"
});

export const PRODUCT_STATUS = Object.freeze({
    AVAILABLE: "AVAILABLE",
    OUT_OF_STOCK: "OUT_OF_STOCK"
});

export const ORDER_STATUS = Object.freeze({
    CREATED: "CREATED",
    ASSIGNED: "ASSIGNED",
    PICKED_UP: "PICKED_UP",
    IN_TRANSIT: "IN_TRANSIT",
    DELIVERED: "DELIVERED",
    CANCELLED: "CANCELLED"
});

export const DELIVERY_PRIORITY = Object.freeze({
    LOW: "LOW",
    NORMAL: "NORMAL",
    HIGH: "HIGH"
});

export const DELIVERY_STATUS = Object.freeze({
    PENDING: "PENDING",
    ASSIGNED: "ASSIGNED",
    IN_TRANSIT: "IN_TRANSIT",
    DELIVERED: "DELIVERED",
    FAILED: "FAILED"
});

export const MOCK_LIMITS = Object.freeze({
    MAX_ITEMS: 100
});