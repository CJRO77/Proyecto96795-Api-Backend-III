
import multer from "multer";
import path from "node:path";
import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { open, unlink } from "node:fs/promises";

import { CustomError } from "../errors/CustomError.js";

// Configuración general.

export const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_MIME_TYPES = {
    "application/pdf": [".pdf"],
    "image/jpeg": [".jpg", ".jpeg"],
    "image/png": [".png"]
};

// Creación de carpetas.

const getUploadPath = (folder) => {
    const uploadPath = path.resolve("uploads", folder);

    fs.mkdirSync(uploadPath, { recursive: true });

    return uploadPath;
};

// Almacenamiento físico.

const storage = multer.diskStorage({

    destination: (req, file, cb) => {
        const folder = req.uploadFolder;

        if (!folder) {
            return cb(new CustomError("UPLOAD_ERROR"));
        }

        cb(null, getUploadPath(folder));
    },

    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname).toLowerCase();

        cb(null, `${randomUUID()}${extension}`);
    }
});

// Validación de MIME y extensión.

const fileFilter = (req, file, cb) => {

    const allowedExtensions = ALLOWED_MIME_TYPES[file.mimetype];
    const extension = path.extname(file.originalname).toLowerCase();

    if (!allowedExtensions || !allowedExtensions.includes(extension)) {
        return cb(new CustomError("INVALID_FILE_TYPE"));
    }

    cb(null, true);
};

// Validación de la firma interna.

const hasValidSignature = async (file) => {

    const signatures = {
        "application/pdf": Buffer.from("%PDF-"),
        "image/jpeg": Buffer.from([0xFF, 0xD8, 0xFF]),
        "image/png": Buffer.from([
            0x89, 0x50, 0x4E, 0x47,
            0x0D, 0x0A, 0x1A, 0x0A
        ])
    };

    const expectedSignature = signatures[file.mimetype];

    if (!expectedSignature) return false;

    const handle = await open(file.path, "r");

    try {
        const buffer = Buffer.alloc(expectedSignature.length);

        const { bytesRead } = await handle.read(
            buffer,
            0,
            expectedSignature.length,
            0
        );

        return (
            bytesRead === expectedSignature.length &&
            buffer.equals(expectedSignature)
        );

    } finally {
        await handle.close();
    }
};

// Creación de middleware reutilizable.

const createUploader = (folder, fieldName) => {

    const uploader = multer({
        storage,
        fileFilter,
        limits: {
            fileSize: MAX_FILE_SIZE,
            files: 1
        }
    });

    return (req, res, next) => {

        req.uploadFolder = folder;

        uploader.single(fieldName)(req, res, async (error) => {

            if (error) {

                if (error instanceof multer.MulterError) {

                    if (error.code === "LIMIT_FILE_SIZE") {
                        return next(new CustomError("FILE_TOO_LARGE"));
                    }

                    if (error.code === "LIMIT_UNEXPECTED_FILE") {
                        return next(new CustomError("INVALID_FILE_FIELD"));
                    }
                }

                return next(error);
            }

            if (!req.file) {
                return next();
            }

            try {

                const validSignature = await hasValidSignature(req.file);

                if (!validSignature) {
                    await unlink(req.file.path);
                    return next(new CustomError("INVALID_FILE_TYPE"));
                }

                next();

            } catch (error) {

                await unlink(req.file.path).catch(() => {});

                next(new CustomError("UPLOAD_ERROR"));
            }
        });
    };
};

// Middlewares para cada tipo de archivo.

export const uploadUserDocument = createUploader("users", "document");

export const uploadDeliveryProof = createUploader(
    "deliveries/proofs",
    "proof"
);
