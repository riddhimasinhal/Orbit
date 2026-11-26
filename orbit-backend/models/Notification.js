const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        type: {
            type: String,
            required: true,
            enum: [
                "connection_request",
                "connection_accepted",
                "connection_declined",
                "campaign_application",
                "application_status",
                "collaboration_created",
                "collaboration_status",
                "deliverable_submitted",
                "deliverable_approved",
                "deliverable_revision_requested",
                "contract_created",
                "contract_status",
                "payment_initiated",
                "payment_completed",
                "payment_failed",
                "new_message",
                "verification_status",
                "system",
            ],
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        relatedEntity: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        relatedEntityType: {
            type: String,
            enum: [
                "Connection",
                "Application",
                "Campaign",
                "Collaboration",
                "Contract",
                "Payment",
                "Conversation",
                "Message",
                "User",
                null,
            ],
            default: null,
        },
        link: {
            type: String,
            default: "",
            trim: true,
        },
        isRead: {
            type: Boolean,
            default: false,
            index: true,
        },
        readAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);
