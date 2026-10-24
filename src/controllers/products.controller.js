import { productsService } from "../services/products.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Controladores para manejar las operaciones CRUD de productos.

export const getProducts = asyncHandler(async (req, res) => {
    const products = await productsService.getAllProducts();
    res.status(200).json({ status: "success", payload: products });
});

export const getProductById = asyncHandler(async (req, res) => {
    const product = await productsService.getProductById(req.params.id);
    res.status(200).json({ status: "success", payload: product });
});

export const createProduct = asyncHandler(async (req, res) => {
    const newProduct = await productsService.createProduct(req.body);
    res.status(201).json({
        status: "success",
        message: "Producto creado correctamente",
        payload: newProduct
    });
});

export const updateProduct = asyncHandler(async (req, res) => {
    const updatedProduct = await productsService.updateProduct(req.params.id, req.body);
    res.status(200).json({
        status: "success",
        message: "Producto actualizado correctamente",
        payload: updatedProduct
    });
});

export const deleteProduct = asyncHandler(async (req, res) => {
    await productsService.deleteProduct(req.params.id);
    res.status(200).json({ status: "success", message: "Producto eliminado correctamente" });
});