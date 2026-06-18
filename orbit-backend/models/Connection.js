const mongoose = require("mongoose")

const connectionSchema = new mongoose.Schema({
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    senderRole: {
        type: String,
        enum: ["creator", "brand"],
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "declined"],
        default: "pending",
    },
    message: {
        type: String,
        default: "",
    }
}, { timestamps: true })

module.exports = mongoose.model("Connection", connectionSchema)
