import { deliveriesService } from "../services/deliveries.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Controladores para los endpoints de entregas.

export const getDeliveries = asyncHandler(async (req, res) => {
    const deliveries = await deliveriesService.getAllDeliveries({ status: req.query.status });
    res.status(200).json({ status: "success", payload: deliveries });
});

export const getDeliveryById = asyncHandler(async (req, res) => {
    const delivery = await deliveriesService.getDeliveryById(req.params.id);
    res.status(200).json({ status: "success", payload: delivery });
});

export const createDelivery = asyncHandler(async (req, res) => {
    const newDelivery = await deliveriesService.createDelivery(req.body);
    res.status(201).json({
        status: "success",
        message: "Entrega creada correctamente",
        payload: newDelivery
    });
});

export const updateDeliveryStatus = asyncHandler(async (req, res) => {
    const updatedDelivery = await deliveriesService.updateDeliveryStatus(req.params.id, req.body.status);
    res.status(200).json({
        status: "success",
        message: "Estado de la entrega actualizado correctamente",
        payload: updatedDelivery
    });
});