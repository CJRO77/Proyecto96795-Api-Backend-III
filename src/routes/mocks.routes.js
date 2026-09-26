import express from "express";

import {
    getMockUsers,
    getMockDrivers,
    getMockOrders,
    getMockDeliveries,
    seedData
} from "../controllers/mocks.controller.js";

// Rutas para la generación de datos simulados y su persistencia en MongoDB

const router = express.Router();

router.get("/users", getMockUsers);
router.get("/drivers", getMockDrivers);
router.get("/orders", getMockOrders);
router.get("/deliveries", getMockDeliveries);

router.post("/seed", seedData);

export default router;