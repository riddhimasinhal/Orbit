const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
    {
        campaignId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Campaign",
            required: true,
        },
        creatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        pitch: {
            type: String,
            required: true,
            trim: true,
            maxlength: 3000,
        },
        proposedBudget: {
            type: Number,
            default: null,
            min: 0,
        },
        status: {
            type: String,
            enum: ["pending", "accepted", "rejected", "withdrawn"],
            default: "pending",
        },
    },
    { timestamps: true }
);

// Prevent duplicate applications by the same creator to the same campaign
applicationSchema.index({ campaignId: 1, creatorId: 1 }, { unique: true });
applicationSchema.index({ campaignId: 1, status: 1, createdAt: -1 });
applicationSchema.index({ creatorId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Application", applicationSchema);
