const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        const token = req.header("Authorization");
        console.log("Received Token:");
        console.log(req.header("Authorization"));
        if (!token) {
            return res.status(401).json({
                message: "No token provided",
            });
        }
        const decoded = jwt.verify(token,
            process.env.JWT_SECRET
        );
        req.user = decoded;
        console.log("decoded", decoded)
        // console.log("Headers:", req.headers);
        // console.log("Token:", req.header("Authorization"));
        next();
    }
    catch (error) {
        res.status(401).json({
            message: "Invalid token",
        })
    }
}
module.exports = authMiddleware;