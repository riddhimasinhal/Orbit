const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
    {
        reporter: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        reportedUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        targetType: {
            type: String,
            required: true,
            enum: ["creator_profile", "brand_profile", "campaign", "conversation", "message", "user"],
        },
        targetId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        reason: {
            type: String,
            required: true,
            enum: [
                "spam",
                "harassment",
                "inappropriate_content",
                "scam_fraud",
                "impersonation",
                "terms_violation",
                "other",
            ],
        },
        description: {
            type: String,
            default: "",
            trim: true,
        },
        status: {
            type: String,
            enum: ["pending", "under_review", "resolved", "dismissed"],
            default: "pending",
            index: true,
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        reviewedAt: {
            type: Date,
            default: null,
        },
        resolution: {
            type: String,
            default: null,
            trim: true,
        },
        resolutionAction: {
            type: String,
            enum: ["none", "content_removed", "user_warned", "user_suspended", "dismissed"],
            default: "none",
        },
    },
    { timestamps: true }
);

reportSchema.index({ reporter: 1, targetType: 1, targetId: 1 });
reportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Report", reportSchema);
