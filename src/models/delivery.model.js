import mongoose from "mongoose";
import { DELIVERY_STATUS } from "../constants/index.js";

// Definición del esquema de entrega

const deliverySchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    status: {
        type: String,
        enum: Object.values(DELIVERY_STATUS),
        default: DELIVERY_STATUS.PENDING
    }
}, { timestamps: true });

const DeliveryModel = mongoose.model("Delivery", deliverySchema);
export default DeliveryModel;