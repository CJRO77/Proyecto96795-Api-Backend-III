import mongoose from "mongoose";
import { ORDER_STATUS, DELIVERY_PRIORITY } from "../constants/index.js";

// Mock data generation para pedidos

const ITEM_NAMES = ["Caja mediana", "Paquete pequeño", "Sobre documentos", "Caja grande", "Bolsa térmica"];
const ADDRESSES = ["Av. Siempre Viva 742", "Calle Falsa 123", "Av. Rivadavia 4500", "San Martín 890", "Belgrano 210"];

const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];
const pickRandomStatus = () => pickRandom(Object.values(ORDER_STATUS));
const pickRandomPriority = () => pickRandom(Object.values(DELIVERY_PRIORITY));

// Genera un pedido falso con un `customerId` dado (o uno aleatorio si no se proporciona)

export const generateMockOrder = (customerId = new mongoose.Types.ObjectId()) => {
    const items = Array.from({ length: Math.floor(Math.random() * 3) + 1 }, () => ({
        name: pickRandom(ITEM_NAMES),
        quantity: Math.floor(Math.random() * 4) + 1,
        price: (Math.floor(Math.random() * 20) + 1) * 100
    }));

    const total = items.reduce((acc, item) => acc + item.quantity * item.price, 0);

    return {
        customer: customerId,
        items,
        deliveryAddress: pickRandom(ADDRESSES),
        total,
        status: pickRandomStatus(),
        priority: pickRandomPriority()
    };
};

// Genera un array de pedidos falsos, cada uno con un `customerId` aleatorio

export const generateMockOrders = (qty, customerIds = []) => {
    return Array.from({ length: qty }, () => {
        const customerId = customerIds.length > 0 ? pickRandom(customerIds) : undefined;
        return generateMockOrder(customerId);
    });
};