import { productsRepository } from "../repositories/products.repository.js";
import { PRODUCT_STATUS } from "../constants/index.js";
import { CustomError } from "../errors/CustomError.js";

// Servicio de productos: lógica de negocio y validación de datos

const validateProductData = (productData, { partial = false } = {}) => {
    const { name, description, price, stock } = productData;

    if (!partial) {
        if (!name || !description || price === undefined || stock === undefined) {
            throw new CustomError(
                "VALIDATION_ERROR",
                "name, description, price y stock son obligatorios"
            );
        }
    }

    if (price !== undefined && price < 0) {
        throw new CustomError("VALIDATION_ERROR", "price no puede ser negativo");
    }

    if (stock !== undefined && stock < 0) {
        throw new CustomError("VALIDATION_ERROR", "stock no puede ser negativo");
    }
};

export const productsService = {

    getAllProducts: async () => {
        return await productsRepository.getAll({ status: PRODUCT_STATUS.AVAILABLE });
    },

    getProductById: async (id) => {
        const product = await productsRepository.getById(id);

        if (!product) {
            throw new CustomError("PRODUCT_NOT_FOUND", `id: ${id}`);
        }

        return product;
    },

    createProduct: async (productData) => {
        validateProductData(productData);

        productData.status = productData.stock === 0
            ? PRODUCT_STATUS.OUT_OF_STOCK
            : PRODUCT_STATUS.AVAILABLE;

        return await productsRepository.create(productData);
    },

    updateProduct: async (id, updateData) => {
        await productsService.getProductById(id);

        validateProductData(updateData, { partial: true });

        if (updateData.stock !== undefined) {
            updateData.status = updateData.stock === 0
                ? PRODUCT_STATUS.OUT_OF_STOCK
                : PRODUCT_STATUS.AVAILABLE;
        }

        return await productsRepository.update(id, updateData);
    },

    deleteProduct: async (id) => {
        await productsService.getProductById(id);

        return await productsRepository.delete(id);
    }
};