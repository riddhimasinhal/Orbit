const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        role: {
            type: String,
            enum: ["creator", "brand", "admin"],
            required: true,
        },
        onBoardingCompleted: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            enum: ["active", "suspended"],
            default: "active",
            index: true,
        },
        suspendedAt: {
            type: Date,
            default: null,
        },
        suspendedReason: {
            type: String,
            default: null,
        },
        suspendedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
