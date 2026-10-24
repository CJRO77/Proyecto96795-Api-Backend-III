
export const normalizeBody = (req, res, next) => {
    req.body = req.body ?? {};
    next();
};