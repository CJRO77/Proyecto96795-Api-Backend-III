export const notFoundHandler = (req, res) => {
    res.status(404).json({
        status: "error",
        error: "ROUTE_NOT_FOUND",
        message: "La ruta solicitada no existe"
    });
};