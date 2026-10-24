import { ordersService } from "../services/orders.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Controladores para manejar las solicitudes relacionadas con los pedidos (orders).

export const getOrders = asyncHandler(async (req, res) => {
    const orders = await ordersService.getAllOrders({ status: req.query.status });
    res.status(200).json({ status: "success", payload: orders });
});

export const getOrderById = asyncHandler(async (req, res) => {
    const order = await ordersService.getOrderById(req.params.id);
    res.status(200).json({ status: "success", payload: order });
});

export const createOrder = asyncHandler(async (req, res) => {
    const newOrder = await ordersService.createOrder(req.body);
    res.status(201).json({
        status: "success",
        message: "Pedido creado correctamente",
        payload: newOrder
    });
});

export const updateOrderStatus = asyncHandler(async (req, res) => {
    const updatedOrder = await ordersService.updateOrderStatus(req.params.id, req.body.status);
    res.status(200).json({
        status: "success",
        message: "Estado del pedido actualizado correctamente",
        payload: updatedOrder
    });
});