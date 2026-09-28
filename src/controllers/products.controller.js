import { productsService } from "../services/products.service.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// Controlador de productos: recibe la request, llama al service y arma la response

export const getProducts = asyncHandler(async (req, res) => {
    const products = await productsService.getAllProducts();
    res.status(200).json({ success: true, data: products });
});

export const getProductById = asyncHandler(async (req, res) => {
    const product = await productsService.getProductById(req.params.id);
    res.status(200).json({ success: true, data: product });
});

export const createProduct = asyncHandler(async (req, res) => {
    const newProduct = await productsService.createProduct(req.body);
    res.status(201).json({
        success: true,
        message: "Producto creado correctamente",
        data: newProduct
    });
});

export const updateProduct = asyncHandler(async (req, res) => {
    const updatedProduct = await productsService.updateProduct(req.params.id, req.body);
    res.status(200).json({
        success: true,
        message: "Producto actualizado correctamente",
        data: updatedProduct
    });
});

export const deleteProduct = asyncHandler(async (req, res) => {
    await productsService.deleteProduct(req.params.id);
    res.status(200).json({ success: true, message: "Producto eliminado correctamente" });
});

