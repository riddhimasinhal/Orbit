const mongoose = require("mongoose");

const creatorProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  fullName: String,
  username: String,
  currentStep: {
    type: Number,
    default: 1
  },
  location: String,

  niche: [String],
  bio: String,

  instagramUsername: String,
  youtubeUrl: String,
  linkedInUrl: String,
  portfolioUrl: String,

  instagramFollowers: Number,
  youtubeSubscribers: Number,
  averageViews: Number,
  audienceCountry: String,

  // Verification & Trust Signals (Phase 4B)
  verificationStatus: {
    type: String,
    enum: ["unverified", "pending", "verified", "rejected"],
    default: "unverified",
  },
  verificationRequestedAt: {
    type: Date,
    default: null,
  },
  verifiedAt: {
    type: Date,
    default: null,
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    default: null,
  },
  verificationRejectedAt: {
    type: Date,
    default: null,
  },
  verificationRejectionReason: {
    type: String,
    default: null,
    trim: true,
  },

}, { timestamps: true });

creatorProfileSchema.index({ userId: 1 }, { unique: true });
creatorProfileSchema.index({ verificationStatus: 1 });

module.exports = mongoose.model(
  "CreatorProfile",
  creatorProfileSchema
);