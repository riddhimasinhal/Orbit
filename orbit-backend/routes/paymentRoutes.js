const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const { paymentLimiter } = require("../middleware/rateLimiter");
const {
    initiatePayment,
    verifyPayment,
    handleWebhook,
    getPaymentHistory,
} = require("../controllers/paymentController");

// Brand initiates payment order for an accepted contract
router.post(
    "/collaboration/:collaborationId/initiate",
    paymentLimiter,
    authMiddleware,
    requireRole("brand"),
    initiatePayment
);

// Participant verifies payment signature after gateway completion
router.post("/verify", paymentLimiter, authMiddleware, verifyPayment);

// Webhook endpoint (verified via HMAC signature in controller)
router.post("/webhook", handleWebhook);

// Get payment history for a collaboration
router.get("/collaboration/:collaborationId", authMiddleware, getPaymentHistory);

module.exports = router;
