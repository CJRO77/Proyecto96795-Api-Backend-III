import mongoose from "mongoose";
import { ORDER_STATUS, DELIVERY_PRIORITY } from "../constants/index.js";

// Definición del esquema de item de pedido

const orderItemSchema = new mongoose.Schema({
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    items: {
        type: [orderItemSchema],
        required: true,
        validate: {
            validator: (items) => Array.isArray(items) && items.length > 0,
            message: "El pedido debe tener al menos un item"
        }
    },
    deliveryAddress: {
        type: String,
        required: true
    },
    total: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: Object.values(ORDER_STATUS),
        default: ORDER_STATUS.CREATED
    },
    priority: {
        type: String,
        enum: Object.values(DELIVERY_PRIORITY),
        default: DELIVERY_PRIORITY.NORMAL
    }
}, { timestamps: true });

const OrderModel = mongoose.model("Order", orderSchema);
export default OrderModel;