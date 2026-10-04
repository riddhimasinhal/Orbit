const mongoose = require("mongoose");

const collaborationSchema = new mongoose.Schema(
    {
        campaignId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Campaign",
            required: true,
        },
        applicationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Application",
            required: true,
        },
        brandId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        creatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        status: {
            type: String,
            enum: ["active", "completed", "cancelled"],
            default: "active",
        },
    },
    { timestamps: true }
);

collaborationSchema.index({ applicationId: 1 }, { unique: true });
collaborationSchema.index({ campaignId: 1, creatorId: 1 }, { unique: true });
collaborationSchema.index({ brandId: 1, status: 1, createdAt: -1 });
collaborationSchema.index({ creatorId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Collaboration", collaborationSchema);
