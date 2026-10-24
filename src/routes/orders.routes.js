import express from "express";

import {
    getOrders,
    getOrderById,
    createOrder,
    updateOrderStatus
} from "../controllers/orders.controller.js";

// Rutas para los endpoints de pedidos.

const router = express.Router();

router.get("/", getOrders);
router.get("/:id", getOrderById);
router.post("/", createOrder);
router.patch("/:id/status", updateOrderStatus);

export default router;