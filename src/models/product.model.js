import mongoose from "mongoose";
import { PRODUCT_STATUS } from "../constants/index.js";

// modelo de producto

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },

    description: {
        type: String,
        required: true
    },

    price: {
        type: Number,
        required: true,
        min: 0
    },

    stock: {
        type: Number,
        required: true,
        min: 0
    },

    status: {
        type: String,
        enum: Object.values(PRODUCT_STATUS),
        default: PRODUCT_STATUS.AVAILABLE
    }
});

const ProductModel = mongoose.model("Product", productSchema);

export default ProductModel;