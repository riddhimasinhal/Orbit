const mongoose = require("mongoose");

const brandProfileSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },

    companyName: String,
    industry: String,
    companySize: String,
    website: String,
    location: String,

    description: String,
    targetAudience: String,
    marketingGoals: String,
    preferredNiche: String,

    instagramPage: String,
    linkedInPage: String,
    contactEmail: String,
    contactPerson: String,

    budgetRange: String,
    preferredPlatform: String,
    campaignFrequency: String,
    targetCountry: String,
});

module.exports = mongoose.model(
    "BrandProfile",
    brandProfileSchema
);