import mongoose from "mongoose";
import { USER_ROLES } from "../constants/index.js";

// Definición del esquema de usuario

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
    }

});

export default mongoose.model("User", userSchema);