
import mongoose from "mongoose";
import { DELIVERY_STATUS } from "../constants/index.js";

// Definición del esquema del comprobante de entrega.

const deliveryProofSchema = new mongoose.Schema({
    originalName: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    path: {
        type: String,
        required: true
    },
    mimeType: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
}, { _id: false });

// Definición del esquema de entrega.

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
    },
    proof: {
        type: deliveryProofSchema,
        default: null
    }
}, { timestamps: true });

const DeliveryModel = mongoose.model("Delivery", deliverySchema);
export default DeliveryModel;
