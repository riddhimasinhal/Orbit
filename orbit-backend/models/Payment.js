const mongoose = require("mongoose");

const webhookEventSchema = new mongoose.Schema(
    {
        eventId: {
            type: String,
            required: true,
        },
        eventType: {
            type: String,
            required: true,
        },
        receivedAt: {
            type: Date,
            default: Date.now,
        },
        payload: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    { _id: false }
);

const paymentSchema = new mongoose.Schema(
    {
        collaborationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Collaboration",
            required: true,
            index: true,
        },
        contractId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Contract",
            required: true,
            index: true,
        },
        campaignId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Campaign",
            required: true,
            index: true,
        },
        payerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        recipientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        currency: {
            type: String,
            required: true,
            default: "INR",
            trim: true,
            uppercase: true,
        },
        status: {
            type: String,
            enum: ["pending", "successful", "failed", "refunded"],
            default: "pending",
            index: true,
        },
        provider: {
            type: String,
            default: "razorpay",
            trim: true,
        },
        orderId: {
            type: String,
            required: true,
            trim: true,
        },
        paymentId: {
            type: String,
            trim: true,
            default: null,
            index: true,
        },
        signature: {
            type: String,
            trim: true,
            default: null,
        },
        idempotencyKey: {
            type: String,
            trim: true,
            sparse: true,
            unique: true,
        },
        webhookEvents: {
            type: [webhookEventSchema],
            default: [],
        },
        errorMessage: {
            type: String,
            trim: true,
            default: null,
        },
        paidAt: {
            type: Date,
            default: null,
        },
        failedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

paymentSchema.index({ collaborationId: 1, status: 1 });
paymentSchema.index({ orderId: 1 }, { unique: true });

module.exports = mongoose.model("Payment", paymentSchema);
