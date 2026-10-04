const mongoose = require("mongoose");

const portfolioItemSchema = new mongoose.Schema(
    {
        creatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 120,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },
        mediaUrl: {
            type: String,
            trim: true,
            default: "",
        },
        mediaType: {
            type: String,
            enum: ["image", "video", "link"],
            default: "link",
        },
        thumbnailUrl: {
            type: String,
            trim: true,
            default: "",
        },
        projectUrl: {
            type: String,
            trim: true,
            default: "",
        },
        cloudinaryPublicId: {
            type: String,
            trim: true,
            default: "",
        },
    },
    { timestamps: true }
);

// Query index supporting GET portfolio sorted by newest first
portfolioItemSchema.index({ creatorId: 1, createdAt: -1 });

module.exports = mongoose.model("PortfolioItem", portfolioItemSchema);
