import express from "express";

import {
    getDeliveries,
    getDeliveryById,
    createDelivery,
    updateDeliveryStatus
} from "../controllers/deliveries.controller.js";

// Rutas para los endpoints de entregas.

const router = express.Router();

router.get("/", getDeliveries);
router.get("/:id", getDeliveryById);
router.post("/", createDelivery);
router.patch("/:id/status", updateDeliveryStatus);

export default router;