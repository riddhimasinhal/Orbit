const mongoose = require("mongoose");

const campaignSchema = new mongoose.Schema(
    {
        brandId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        description: {
            type: String,
            required: true,
            trim: true,
        },
        niche: [
            {
                type: String,
                trim: true,
            },
        ],
        budgetMin: {
            type: Number,
            default: 0,
            min: 0,
        },
        budgetMax: {
            type: Number,
            default: 0,
            min: 0,
        },
        deliverables: [
            {
                type: String,
                trim: true,
            },
        ],
        applicationDeadline: {
            type: Date,
            default: null,
        },
        startDate: {
            type: Date,
            default: null,
        },
        endDate: {
            type: Date,
            default: null,
        },
        status: {
            type: String,
            enum: ["draft", "published", "closed"],
            default: "draft",
        },
    },
    { timestamps: true }
);

campaignSchema.index({ brandId: 1, status: 1 });
campaignSchema.index({ status: 1, createdAt: -1 });
campaignSchema.index({ status: 1, niche: 1 });

module.exports = mongoose.model("Campaign", campaignSchema);
