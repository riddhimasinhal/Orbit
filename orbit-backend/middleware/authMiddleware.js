const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        const rawToken = req.header("Authorization");
        if (!rawToken) {
            return res.status(401).json({
                message: "No token provided",
            });
        }
        // remove Bearer if someone sends it that way
        const token = rawToken.startsWith("Bearer ") ? rawToken.slice(7) : rawToken;
        if (!process.env.JWT_SECRET) {
            return res.status(500).json({
                message: "Server configuration error: JWT_SECRET is not defined",
            });
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(401).json({
            message: "Invalid or expired token",
        });
    }
}
module.exports = authMiddleware;