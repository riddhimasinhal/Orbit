const mongoose = require("mongoose");

const moderationAuditLogSchema = new mongoose.Schema(
    {
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        action: {
            type: String,
            required: true,
            trim: true,
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        targetType: {
            type: String,
            required: true,
            trim: true,
        },
        reason: {
            type: String,
            default: "",
            trim: true,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    { timestamps: true }
);

moderationAuditLogSchema.index({ adminId: 1, createdAt: -1 });
moderationAuditLogSchema.index({ targetType: 1, targetId: 1 });

module.exports = mongoose.model("ModerationAuditLog", moderationAuditLogSchema);
