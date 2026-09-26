import mongoose from "mongoose";
import { ORDER_STATUS, DELIVERY_PRIORITY } from "../constants/index.js";

// Mock data generation para pedidos

const ITEM_NAMES = ["Caja mediana", "Paquete pequeño", "Sobre documentos", "Caja grande", "Bolsa térmica"];
const ADDRESSES = ["Av. Siempre Viva 742", "Calle Falsa 123", "Av. Rivadavia 4500", "San Martín 890", "Belgrano 210"];

const pickRandom = (list) => list[Math.floor(Math.random() * list.length)];
const pickRandomStatus = () => pickRandom(Object.values(ORDER_STATUS));
const pickRandomPriority = () => pickRandom(Object.values(DELIVERY_PRIORITY));

/**
 * Genera un pedido falso. `customerId` es obligatorio para reflejar la
 * relación real pedido → usuario. Si no se provee un id real (por ejemplo,
 * en el endpoint GET que solo previsualiza datos sin guardar), se usa un
 * ObjectId válido pero inventado, solo para que la estructura sea consistente.
 */

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

/**
 * customerIds: ids reales de usuarios ya existentes en la base.
 * Cada pedido toma uno al azar, para respetar la relación pedido ↔ usuario.
 */

export const generateMockOrders = (qty, customerIds = []) => {
    return Array.from({ length: qty }, () => {
        const customerId = customerIds.length > 0 ? pickRandom(customerIds) : undefined;
        return generateMockOrder(customerId);
    });
};