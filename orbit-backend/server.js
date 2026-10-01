const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const creatorRoutes = require("./routes/creatorRoutes");
const brandRoutes = require("./routes/brandRoutes");
const connectionRoutes = require("./routes/connectionRoutes");
dotenv.config();

if (!process.env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET environment variable is not defined.");
    process.exit(1);
}

connectDB();



const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

app.use("/api/auth", authRoutes);
app.use("/api/creator", creatorRoutes);
app.use("/api/brand", brandRoutes);
app.use("/api/connections", connectionRoutes);

app.get('/', (req, res) => {
    res.send("API running");
})

// Central error handling middleware
app.use((err, req, res, next) => {
    if (err.name === "CastError") {
        return res.status(400).json({ message: "Invalid resource identifier" });
    }
    if (err.name === "ValidationError") {
        return res.status(400).json({ message: err.message });
    }
    if (err.code === 11000) {
        return res.status(400).json({ message: "Duplicate resource already exists" });
    }
    console.error("Unhandled error:", err.message);
    res.status(err.status || 500).json({ message: err.message || "Internal server error" });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(">>> SERVER RESTARTED AT:", new Date().toLocaleTimeString());
})

