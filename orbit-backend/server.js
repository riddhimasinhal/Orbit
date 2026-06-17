const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const creatorRoutes = require("./routes/creatorRoutes");
const brandRoutes = require("./routes/brandRoutes");
dotenv.config();

connectDB();



const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

app.use("/api/auth", authRoutes);
app.use("/api/creator", creatorRoutes);
app.use("/api/brand", brandRoutes);

app.get('/', (req, res) => {
    res.send("API running");
})
app
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(">>> SERVER RESTARTED AT:", new Date().toLocaleTimeString());
})

