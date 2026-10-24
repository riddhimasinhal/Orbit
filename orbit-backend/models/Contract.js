const mongoose = require("mongoose");

const contractDeliverableSchema = new mongoose.Schema(
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
        dueDate: {
            type: Date,
            default: null,
        },
    },
    { _id: false }
);

const contractHistorySchema = new mongoose.Schema(
    {
        version: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            required: true,
        },
        compensation: {
            amount: { type: Number, required: true },
            currency: { type: String, default: "INR" },
        },
        paymentTerms: {
            type: String,
            default: "",
        },
        deliverables: [contractDeliverableSchema],
        brandAcceptance: {
            accepted: { type: Boolean, default: false },
            acceptedAt: { type: Date, default: null },
            acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        },
        creatorAcceptance: {
            accepted: { type: Boolean, default: false },
            acceptedAt: { type: Date, default: null },
            acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        },
        modifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        modifiedAt: {
            type: Date,
            default: Date.now,
        },
        note: {
            type: String,
            default: "",
        },
    },
    { _id: false }
);

const contractSchema = new mongoose.Schema(
    {
        collaborationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Collaboration",
            required: true,
            index: true,
        },
        campaignId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Campaign",
            required: true,
            index: true,
        },
        brandId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        creatorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        version: {
            type: Number,
            default: 1,
            min: 1,
        },
        status: {
            type: String,
            enum: ["draft", "sent", "accepted", "rejected", "withdrawn", "superseded"],
            default: "draft",
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 300,
        },
        compensation: {
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
        },
        paymentTerms: {
            type: String,
            trim: true,
            default: "100% on successful completion and approval of all deliverables",
            maxlength: 1000,
        },
        deliverables: {
            type: [contractDeliverableSchema],
            default: [],
        },
        campaignTimeline: {
            startDate: { type: Date, default: null },
            endDate: { type: Date, default: null },
        },
        termsAndConditions: {
            type: String,
            trim: true,
            default: "Standard collaboration agreement: Deliverables must be original, meet agreed campaign guidelines, and be delivered on or before the agreed deadlines.",
            maxlength: 5000,
        },
        brandAcceptance: {
            accepted: { type: Boolean, default: false },
            acceptedAt: { type: Date, default: null },
            acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        },
        creatorAcceptance: {
            accepted: { type: Boolean, default: false },
            acceptedAt: { type: Date, default: null },
            acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        },
        rejectedAt: {
            type: Date,
            default: null,
        },
        rejectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        rejectionReason: {
            type: String,
            trim: true,
            default: null,
        },
        withdrawnAt: {
            type: Date,
            default: null,
        },
        history: {
            type: [contractHistorySchema],
            default: [],
        },
    },
    { timestamps: true }
);

contractSchema.index({ collaborationId: 1, status: 1 });
contractSchema.index({ brandId: 1, status: 1 });
contractSchema.index({ creatorId: 1, status: 1 });

module.exports = mongoose.model("Contract", contractSchema);
