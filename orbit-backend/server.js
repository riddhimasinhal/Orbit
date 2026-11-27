const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const dotenv = require("dotenv");
const connectDB = require("./config/db");

// Load .env explicitly from backend directory then fall back to current directory
dotenv.config({ path: path.join(__dirname, ".env") });
dotenv.config();

const authRoutes = require("./routes/authRoutes");
const creatorRoutes = require("./routes/creatorRoutes");
const brandRoutes = require("./routes/brandRoutes");
const connectionRoutes = require("./routes/connectionRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const campaignRoutes = require("./routes/campaignRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const collaborationRoutes = require("./routes/collaborationRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const verificationRoutes = require("./routes/verificationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const contractRoutes = require("./routes/contractRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

// Phase 6–7 routes
const analyticsRoutes = require("./routes/analyticsRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const reportRoutes = require("./routes/reportRoutes");
const blockRoutes = require("./routes/blockRoutes");

// Security & Rate Limiting
const { generalLimiter } = require("./middleware/rateLimiter");

if (!process.env.JWT_SECRET) {
    console.error("FATAL ERROR: JWT_SECRET environment variable is not defined.");
    process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Trust reverse proxy if configured (e.g. Render, Heroku, AWS ALB, Nginx)
if (process.env.TRUST_PROXY) {
    app.set("trust proxy", process.env.TRUST_PROXY === "true" || process.env.TRUST_PROXY === "1" ? 1 : process.env.TRUST_PROXY);
} else {
    // In production, default to trust the first proxy hop
    if (process.env.NODE_ENV === "production") {
        app.set("trust proxy", 1);
    }
}

// -------------------------------------------------------------
// HELMET SECURITY HEADERS
// -------------------------------------------------------------
app.use(
    helmet({
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'",
                    "https://checkout.razorpay.com",
                ],
                connectSrc: [
                    "'self'",
                    "https://api.razorpay.com",
                    "https://lumberjack.razorpay.com",
                    "https://api.cloudinary.com",
                ],
                imgSrc: [
                    "'self'",
                    "data:",
                    "blob:",
                    "https://res.cloudinary.com",
                    "https://*.cloudinary.com",
                ],
                mediaSrc: [
                    "'self'",
                    "data:",
                    "blob:",
                    "https://res.cloudinary.com",
                    "https://*.cloudinary.com",
                ],
                frameSrc: [
                    "'self'",
                    "https://api.razorpay.com",
                    "https://checkout.razorpay.com",
                ],
                objectSrc: ["'none'"],
                upgradeInsecureRequests: process.env.NODE_ENV === "production" ? [] : null,
            },
        },
        crossOriginResourcePolicy: { policy: "cross-origin" },
        hsts:
            process.env.NODE_ENV === "production"
                ? { maxAge: 31536000, includeSubDomains: true, preload: true }
                : false,
        frameguard: { action: "deny" },
        referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    })
);

// -------------------------------------------------------------
// ENVIRONMENT-BASED CORS ORIGIN RESTRICTION
// -------------------------------------------------------------
const allowedOrigins = [
    process.env.CLIENT_URL,
    ...(process.env.ADDITIONAL_CLIENT_URLS ? process.env.ADDITIONAL_CLIENT_URLS.split(",") : []),
]
    .filter(Boolean)
    .map((url) => url.trim().replace(/\/$/, ""));

// In development or test, allow standard local dev servers if not explicitly specified
if (process.env.NODE_ENV !== "production") {
    const devOrigins = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
    ];
    devOrigins.forEach((origin) => {
        if (!allowedOrigins.includes(origin)) {
            allowedOrigins.push(origin);
        }
    });
}

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, server-to-server tests)
        if (!origin) {
            return callback(null, true);
        }

        const normalizedOrigin = origin.trim().replace(/\/$/, "");
        if (allowedOrigins.includes(normalizedOrigin)) {
            callback(null, true);
        } else {
            const corsError = new Error(`CORS policy: origin '${origin}' is not allowed`);
            corsError.status = 403;
            callback(corsError);
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
        "Content-Type",
        "Authorization",
        "x-razorpay-signature",
        "x-razorpay-event-id",
    ],
    maxAge: 86400, // Preflight cache for 24 hours
};

app.use(cors(corsOptions));

// Capture raw body buffer for cryptographically accurate Razorpay webhook verification
app.use(
    express.json({
        limit: "10mb",
        verify: (req, res, buf) => {
            req.rawBody = buf;
        },
    })
);

app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// General API rate limiting for all endpoints
app.use("/api", generalLimiter);

// Existing Phase 0–5 routes
app.use("/api/auth", authRoutes);
app.use("/api/creator", creatorRoutes);
app.use("/api/creators", creatorRoutes);
app.use("/api/brand", brandRoutes);
app.use("/api/connections", connectionRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/collaborations", collaborationRoutes);
app.use("/api/contracts", contractRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/admin", adminRoutes);

// Phase 6–7 routes
app.use("/api/analytics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/blocks", blockRoutes);

app.get("/", (req, res) => {
    res.send("API running");
});

// Central error handling middleware
app.use((err, req, res, next) => {
    if (err.message && err.message.startsWith("CORS policy:")) {
        return res.status(403).json({ message: err.message });
    }
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
    res.status(err.status || 500).json({
        message: err.message || "Internal server error",
    });
});

const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(">>> SERVER RESTARTED AT:", new Date().toLocaleTimeString());
        });
    } catch (error) {
        console.error("Server startup failed:", error.message);
        process.exit(1);
    }
};

// Start server when run directly
if (require.main === module) {
    startServer();
}

module.exports = app;
