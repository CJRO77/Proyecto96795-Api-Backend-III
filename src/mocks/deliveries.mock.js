import mongoose from "mongoose";
import { DELIVERY_STATUS } from "../constants/index.js";

// Mock data generation para entregas

const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];
const pickRandomStatus = () => pickRandom(Object.values(DELIVERY_STATUS));

// Genera un objeto de entrega de mock con un orderId y un driverId opcionales.

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

// Genera un array de objetos de entrega de mock con una cantidad específica, y opcionalmente con listas de orderIds y driverIds.

export const generateMockDeliveries = (qty, orderIds = [], driverIds = []) => {
    return Array.from({ length: qty }, () => {
        const orderId = orderIds.length > 0 ? pickRandom(orderIds) : undefined;
        const shouldAssignDriver = driverIds.length > 0 && Math.random() < 0.7;
        const driverId = shouldAssignDriver ? pickRandom(driverIds) : null;

        return generateMockDelivery(orderId, driverId);
    });
};