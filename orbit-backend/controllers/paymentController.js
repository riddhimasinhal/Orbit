const mongoose = require("mongoose");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const Contract = require("../models/Contract");
const Collaboration = require("../models/Collaboration");

let RazorpayInstance = null;
function getRazorpay() {
    if (RazorpayInstance) return RazorpayInstance;
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (keyId && keySecret) {
        try {
            const Razorpay = require("razorpay");
            RazorpayInstance = new Razorpay({
                key_id: keyId,
                key_secret: keySecret,
            });
            return RazorpayInstance;
        } catch (e) {
            console.warn("Could not instantiate Razorpay SDK:", e.message);
        }
    }
    return null;
}

/**
 * Helper: Validate ObjectId
 */
function isValidId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

/**
 * POST /api/payments/collaboration/:collaborationId/initiate
 * Brand initiates payment for an accepted contract
 */
const initiatePayment = async (req, res) => {
    try {
        const { collaborationId } = req.params;
        const userId = req.user.userId || req.user._id;

        if (!isValidId(collaborationId)) {
            return res.status(400).json({ message: "Invalid collaboration ID" });
        }

        const collaboration = await Collaboration.findById(collaborationId);
        if (!collaboration) {
            return res.status(404).json({ message: "Collaboration not found" });
        }

        // Authorization: Only the collaboration's brand can initiate payment
        if (collaboration.brandId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Access forbidden: only the paying brand can initiate payments" });
        }

        // Retrieve the current contract
        const contract = await Contract.findOne({ collaborationId });
        if (!contract) {
            return res.status(400).json({ message: "No contract exists for this collaboration" });
        }

        // Contract must be accepted by both parties
        if (contract.status !== "accepted") {
            return res.status(400).json({
                message: `Payments require an accepted contract. Current contract status is '${contract.status}'.`,
            });
        }

        // DERIVE AMOUNT AND CURRENCY STRICTLY FROM THE ACCEPTED CONTRACT
        // Frontend supplied amounts are deliberately ignored to prevent tampering
        const amount = contract.compensation.amount;
        const currency = contract.compensation.currency || "INR";

        if (amount <= 0) {
            return res.status(400).json({ message: "Agreed contract amount must be greater than zero" });
        }

        const razorpay = getRazorpay();
        let orderId;
        const isLiveProvider = Boolean(razorpay);

        if (isLiveProvider) {
            try {
                const order = await razorpay.orders.create({
                    amount: Math.round(amount * 100), // convert to paisa
                    currency,
                    receipt: `collab_${collaboration._id.toString().slice(-8)}_${Date.now().toString().slice(-6)}`,
                    notes: {
                        collaborationId: collaboration._id.toString(),
                        contractId: contract._id.toString(),
                        brandId: collaboration.brandId.toString(),
                        creatorId: collaboration.creatorId.toString(),
                    },
                });
                orderId = order.id;
            } catch (rzpErr) {
                console.error("Razorpay order creation error:", rzpErr);
                return res.status(502).json({
                    message: "Payment gateway error during order creation: " + (rzpErr.error?.description || rzpErr.message),
                });
            }
        } else {
            // Safe testable fallback when live Razorpay credentials are not provided
            orderId = `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        }

        const payment = await Payment.create({
            collaborationId: collaboration._id,
            contractId: contract._id,
            campaignId: collaboration.campaignId,
            payerId: collaboration.brandId,
            recipientId: collaboration.creatorId,
            amount,
            currency,
            status: "pending",
            provider: "razorpay",
            orderId,
            idempotencyKey: req.body?.idempotencyKey || undefined,
        });

        return res.status(201).json({
            success: true,
            message: "Payment order initiated",
            payment,
            orderId,
            amount,
            currency,
            razorpayKeyId: process.env.RAZORPAY_KEY_ID || null,
            isTestMode: !isLiveProvider,
        });
    } catch (error) {
        console.error("Error in initiatePayment:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * POST /api/payments/verify
 * Verifies Razorpay payment signature and finalizes payment
 */
const verifyPayment = async (req, res) => {
    try {
        const { orderId, paymentId, signature } = req.body;
        const userId = req.user.userId || req.user._id;

        if (!orderId || !paymentId || !signature) {
            return res.status(400).json({ message: "orderId, paymentId, and signature are required" });
        }

        const payment = await Payment.findOne({ orderId });
        if (!payment) {
            return res.status(404).json({ message: "Payment order record not found" });
        }

        // Authorization: Payer or recipient
        const isPayer = payment.payerId.toString() === userId.toString();
        const isRecipient = payment.recipientId.toString() === userId.toString();
        if (!isPayer && !isRecipient) {
            return res.status(403).json({ message: "Access forbidden: you are not authorized to verify this payment" });
        }

        // Verify Razorpay HMAC signature
        const secret = process.env.RAZORPAY_KEY_SECRET || "orbit_test_secret";
        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(`${orderId}|${paymentId}`)
            .digest("hex");

        if (expectedSignature !== signature) {
            payment.status = "failed";
            payment.failedAt = new Date();
            payment.errorMessage = "Invalid payment signature verification failed";
            await payment.save();

            return res.status(400).json({
                message: "Invalid payment signature. Verification failed.",
            });
        }

        // Update payment to successful
        payment.status = "successful";
        payment.paymentId = paymentId;
        payment.signature = signature;
        payment.paidAt = new Date();
        payment.errorMessage = null;

        await payment.save();

        return res.status(200).json({
            success: true,
            message: "Payment verified successfully",
            payment,
        });
    } catch (error) {
        console.error("Error in verifyPayment:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * POST /api/payments/webhook
 * Razorpay webhook handler with raw body signature check & idempotency protection
 */
const handleWebhook = async (req, res) => {
    try {
        const webhookSignature = req.headers["x-razorpay-signature"];
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || "orbit_webhook_secret";

        // Signature verification requires the raw request buffer
        const rawPayload = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);

        if (!webhookSignature) {
            return res.status(400).json({ message: "Missing x-razorpay-signature header" });
        }

        const expectedSignature = crypto
            .createHmac("sha256", webhookSecret)
            .update(rawPayload)
            .digest("hex");

        if (expectedSignature !== webhookSignature) {
            return res.status(400).json({ message: "Invalid webhook signature" });
        }

        const event = req.body;
        const eventType = event.event;
        const eventId = req.headers["x-razorpay-event-id"] || event.event_id || event.id;

        const orderId = event.payload?.payment?.entity?.order_id || event.payload?.order?.entity?.id;
        const paymentId = event.payload?.payment?.entity?.id;

        if (!orderId) {
            return res.status(200).json({ status: "acknowledged", message: "Event ignored (no order ID)" });
        }

        const payment = await Payment.findOne({ orderId });
        if (!payment) {
            return res.status(200).json({ status: "acknowledged", message: "Order not found in Orbit records" });
        }

        // IDEMPOTENCY CHECK:
        // Prevent duplicate processing of the same provider event
        if (eventId && payment.webhookEvents.some((ev) => ev.eventId === eventId)) {
            return res.status(200).json({
                status: "ignored",
                message: "Duplicate webhook event already processed",
            });
        }

        // Record the event
        if (eventId) {
            payment.webhookEvents.push({
                eventId,
                eventType: eventType || "unknown",
                receivedAt: new Date(),
                payload: event,
            });
        }

        if (eventType === "payment.captured" || eventType === "order.paid") {
            payment.status = "successful";
            if (paymentId) payment.paymentId = paymentId;
            if (!payment.paidAt) payment.paidAt = new Date();
            payment.errorMessage = null;
        } else if (eventType === "payment.failed") {
            payment.status = "failed";
            payment.failedAt = new Date();
            payment.errorMessage = event.payload?.payment?.entity?.error_description || "Payment failed via webhook";
        }

        await payment.save();

        return res.status(200).json({
            status: "success",
            message: "Webhook processed",
        });
    } catch (error) {
        console.error("Error in handleWebhook:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * GET /api/payments/collaboration/:collaborationId
 * Retrieve transaction history for a collaboration
 */
const getPaymentHistory = async (req, res) => {
    try {
        const { collaborationId } = req.params;
        const userId = req.user.userId || req.user._id;

        if (!isValidId(collaborationId)) {
            return res.status(400).json({ message: "Invalid collaboration ID" });
        }

        const collaboration = await Collaboration.findById(collaborationId).lean();
        if (!collaboration) {
            return res.status(404).json({ message: "Collaboration not found" });
        }

        // Authorization: Only brand or creator participant can access
        const isBrand = collaboration.brandId.toString() === userId.toString();
        const isCreator = collaboration.creatorId.toString() === userId.toString();
        if (!isBrand && !isCreator) {
            return res.status(403).json({ message: "Access forbidden: you are not a participant in this collaboration" });
        }

        const payments = await Payment.find({ collaborationId })
            .sort({ createdAt: -1 })
            .populate("payerId", "name email")
            .populate("recipientId", "name email")
            .lean();

        const providerConfigured = Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

        return res.status(200).json({
            success: true,
            payments,
            providerConfigured,
            provider: "razorpay",
            keyId: process.env.RAZORPAY_KEY_ID || null,
        });
    } catch (error) {
        console.error("Error in getPaymentHistory:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    initiatePayment,
    verifyPayment,
    handleWebhook,
    getPaymentHistory,
};
