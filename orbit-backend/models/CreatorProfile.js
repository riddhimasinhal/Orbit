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

  niche: String,
  bio: String,

  instagramUsername: String,
  youtubeUrl: String,
  linkedInUrl: String,
  portfolioUrl: String,

  instagramFollowers: Number,
  youtubeSubscribers: Number,
  averageViews: Number,
  audienceCountry: String,

}, { timestamps: true });

module.exports = mongoose.model(
  "CreatorProfile",
  creatorProfileSchema
);