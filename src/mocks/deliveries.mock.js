import mongoose from "mongoose";
import { DELIVERY_STATUS } from "../constants/index.js";

// Mock data generation para entregas

const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];
const pickRandomStatus = () => pickRandom(Object.values(DELIVERY_STATUS));

/**
 * Genera una entrega asociada a un pedido (obligatorio) y, cuando
 * corresponde, a un repartidor (opcional).
 */
export const generateMockDelivery = (
    orderId = new mongoose.Types.ObjectId(),
    driverId = null
) => {
    return {
        order: orderId,
        driver: driverId,
        status: pickRandomStatus()
    };
};

/**
 * orderIds: ids reales de pedidos existentes (obligatorio).
 * driverIds: ids reales de repartidores (opcional: ~70% de las entregas
 * se asignan a un repartidor, el resto queda sin asignar).
 */
export const generateMockDeliveries = (qty, orderIds = [], driverIds = []) => {
    return Array.from({ length: qty }, () => {
        const orderId = orderIds.length > 0 ? pickRandom(orderIds) : undefined;
        const shouldAssignDriver = driverIds.length > 0 && Math.random() < 0.7;
        const driverId = shouldAssignDriver ? pickRandom(driverIds) : null;

        return generateMockDelivery(orderId, driverId);
    });
};