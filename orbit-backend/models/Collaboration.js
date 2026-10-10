const mongoose = require("mongoose");

const deliverableSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        description: {
            type: String,
            trim: true,
            maxlength: 2000,
            default: "",
        },
        status: {
            type: String,
            enum: ["pending", "submitted", "revision_requested", "approved"],
            default: "pending",
        },
        dueDate: {
            type: Date,
            default: null,
        },
        submissionUrl: {
            type: String,
            trim: true,
            default: "",
        },
        submissionNotes: {
            type: String,
            trim: true,
            default: "",
        },
        submittedAt: {
            type: Date,
            default: null,
        },
        revisionFeedback: {
            type: String,
            trim: true,
            default: null,
        },
        revisionRequestedAt: {
            type: Date,
            default: null,
        },
        approvedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

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
        deliverables: {
            type: [deliverableSchema],
            default: [],
        },
    },
    { timestamps: true }
);

collaborationSchema.index({ applicationId: 1 }, { unique: true });
collaborationSchema.index({ campaignId: 1, creatorId: 1 }, { unique: true });
collaborationSchema.index({ brandId: 1, status: 1, createdAt: -1 });
collaborationSchema.index({ creatorId: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Collaboration", collaborationSchema);
