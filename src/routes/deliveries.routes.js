import express from "express";
import { uploadDeliveryProof as uploadDeliveryProofMiddleware } from "../config/multer.config.js";
import {
  getDeliveries,
  getDeliveryById,
  createDelivery,
  updateDeliveryStatus,
    uploadDeliveryProof
} from "../controllers/deliveries.controller.js";


// Rutas para los endpoints de entregas.

const router = express.Router();

router.get("/", getDeliveries);
router.get("/:id", getDeliveryById);
router.post("/", createDelivery);
router.patch("/:id/status", updateDeliveryStatus);
router.post("/:id/proof", uploadDeliveryProofMiddleware, uploadDeliveryProof);

export default router;
