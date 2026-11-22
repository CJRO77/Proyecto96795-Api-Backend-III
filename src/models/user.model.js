import mongoose from "mongoose";
import {
    USER_ROLES,
    USER_DOCUMENT_TYPES
} from "../constants/index.js";

// Definición del esquema de usuario

const userDocumentSchema = new mongoose.Schema({
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
    type: {
        type: String,
        enum: Object.values(USER_DOCUMENT_TYPES),
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});


const userSchema = new mongoose.Schema({

    firstName: {
        type: String,
        required: true
    },

    lastName: {
        type: String,
        required: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    role: {
        type: String,
        enum: Object.values(USER_ROLES),
        default: USER_ROLES.USER
    },

    isAvailable: {
        type: Boolean,
        default: true
    },

    documents: {
    type: [userDocumentSchema],
    default: []
}

});

export default mongoose.model("User", userSchema);