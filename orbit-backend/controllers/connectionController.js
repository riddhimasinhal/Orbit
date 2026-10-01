const mongoose = require("mongoose")
const Connection = require("../models/Connection")
const User = require("../models/User")
const CreatorProfile = require("../models/CreatorProfile")
const BrandProfile = require("../models/BrandProfile")

const sendRequest = async (req, res) => {
    try {
        const senderId = req.user.userId
        const senderRole = req.user.role
        const { receiverId, message } = req.body

        if (!receiverId || !mongoose.Types.ObjectId.isValid(receiverId)) {
            return res.status(400).json({ message: "A valid receiver ID is required" })
        }

        if (senderId.toString() === receiverId.toString()) {
            return res.status(400).json({ message: "Cannot send connection request to yourself" })
        }

        const receiverUser = await User.findById(receiverId)
        if (!receiverUser) {
            return res.status(404).json({ message: "Recipient user not found" })
        }

        const senderUser = await User.findById(senderId)
        if (!senderUser) {
            return res.status(404).json({ message: "Sender user not found" })
        }

        if (senderUser.role === receiverUser.role) {
            return res.status(400).json({ message: "Connection requests can only be sent between a creator and a brand" })
        }

        // check if already sent
        const existing = await Connection.findOne({
            senderId,
            receiverId,
        })
        if (existing) {
            return res.status(400).json({ message: "Request already sent" })
        }

        // also check reverse direction
        const reverse = await Connection.findOne({
            senderId: receiverId,
            receiverId: senderId,
        })
        if (reverse) {
            return res.status(400).json({ message: "This user already sent you a request" })
        }

        const connection = await Connection.create({
            senderId,
            receiverId,
            senderRole: senderUser.role,
            message: message || "",
        })

        console.log("Connection request sent:", connection._id)
        res.status(201).json({ message: "Request sent", connection })
    }
    catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Connection request already exists" })
        }
        if (error.name === "CastError") {
            return res.status(400).json({ message: "Invalid ID format" })
        }
        console.error("send request error:", error.message)
        res.status(500).json({ message: "Failed to send connection request" })
    }
}

const getReceivedRequests = async (req, res) => {
    try {
        const userId = req.user.userId
        const requests = await Connection.find({ receiverId: userId }).sort({ createdAt: -1 })

        const creatorSenderIds = []
        const brandSenderIds = []
        for (let i = 0; i < requests.length; i++) {
            const req_item = requests[i]
            if (req_item.senderRole === "creator") {
                creatorSenderIds.push(req_item.senderId)
            } else {
                brandSenderIds.push(req_item.senderId)
            }
        }

        const [creatorProfiles, brandProfiles] = await Promise.all([
            creatorSenderIds.length > 0
                ? CreatorProfile.find({ userId: { $in: creatorSenderIds } })
                : [],
            brandSenderIds.length > 0
                ? BrandProfile.find({ userId: { $in: brandSenderIds } })
                : [],
        ])

        const creatorMap = new Map(creatorProfiles.map((p) => [p.userId.toString(), p]))
        const brandMap = new Map(brandProfiles.map((p) => [p.userId.toString(), p]))

        const populated = requests.map((req_item) => {
            const senderInfo =
                req_item.senderRole === "creator"
                    ? creatorMap.get(req_item.senderId.toString())
                    : brandMap.get(req_item.senderId.toString())

            return {
                _id: req_item._id,
                senderId: req_item.senderId,
                senderRole: req_item.senderRole,
                status: req_item.status,
                message: req_item.message,
                createdAt: req_item.createdAt,
                senderName: senderInfo?.fullName || senderInfo?.companyName || "Unknown",
                senderLocation: senderInfo?.location || "",
                senderNiche: senderInfo?.niche || senderInfo?.preferredNiche || [],
                senderProfileId: senderInfo?._id,
            }
        })

        console.log("Received requests:", populated.length)
        res.status(200).json({ requests: populated })
    }
    catch (error) {
        console.log("get received error:", error)
        res.status(500).json({ message: error.message })
    }
}

const getSentRequests = async (req, res) => {
    try {
        const userId = req.user.userId
        const requests = await Connection.find({ senderId: userId }).sort({ createdAt: -1 })

        const receiverIds = [...new Set(requests.map((r) => r.receiverId.toString()))]

        const receiverUsers = receiverIds.length > 0
            ? await User.find({ _id: { $in: receiverIds } })
            : []
        const userMap = new Map(receiverUsers.map((u) => [u._id.toString(), u]))

        const creatorReceiverIds = []
        const brandReceiverIds = []
        for (const rId of receiverIds) {
            const user = userMap.get(rId)
            if (user?.role === "creator") {
                creatorReceiverIds.push(rId)
            } else if (user?.role === "brand") {
                brandReceiverIds.push(rId)
            }
        }

        const [creatorProfiles, brandProfiles] = await Promise.all([
            creatorReceiverIds.length > 0
                ? CreatorProfile.find({ userId: { $in: creatorReceiverIds } })
                : [],
            brandReceiverIds.length > 0
                ? BrandProfile.find({ userId: { $in: brandReceiverIds } })
                : [],
        ])

        const creatorMap = new Map(creatorProfiles.map((p) => [p.userId.toString(), p]))
        const brandMap = new Map(brandProfiles.map((p) => [p.userId.toString(), p]))

        const populated = requests.map((req_item) => {
            const receiverUser = userMap.get(req_item.receiverId.toString())
            const receiverInfo =
                receiverUser?.role === "creator"
                    ? creatorMap.get(req_item.receiverId.toString())
                    : brandMap.get(req_item.receiverId.toString())

            return {
                _id: req_item._id,
                receiverId: req_item.receiverId,
                status: req_item.status,
                message: req_item.message,
                createdAt: req_item.createdAt,
                receiverName: receiverInfo?.fullName || receiverInfo?.companyName || "Unknown",
                receiverLocation: receiverInfo?.location || "",
                receiverRole: receiverUser?.role,
                receiverProfileId: receiverInfo?._id,
            }
        })

        console.log("Sent requests:", populated.length)
        res.status(200).json({ requests: populated })
    }
    catch (error) {
        console.log("get sent error:", error)
        res.status(500).json({ message: error.message })
    }
}

const updateRequest = async (req, res) => {
    try {
        const userId = req.user.userId
        const { id } = req.params
        const { status } = req.body

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Invalid request ID" })
        }

        if (status !== "accepted" && status !== "declined") {
            return res.status(400).json({ message: "Status must be accepted or declined" })
        }

        const connection = await Connection.findById(id)
        if (!connection) {
            return res.status(404).json({ message: "Request not found" })
        }

        // only receiver can accept/decline
        if (connection.receiverId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Not authorized to update this request" })
        }

        // State integrity: only pending requests can be accepted or declined
        if (connection.status !== "pending") {
            return res.status(400).json({ message: `Request has already been ${connection.status}` })
        }

        connection.status = status
        await connection.save()

        console.log("Request updated:", id, status)
        res.status(200).json({ message: "Request " + status, connection })
    }
    catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({ message: "Invalid request ID" })
        }
        console.error("update request error:", error.message)
        res.status(500).json({ message: "Failed to update request" })
    }
}

const getPendingCount = async (req, res) => {
    try {
        const userId = req.user.userId
        const count = await Connection.countDocuments({
            receiverId: userId,
            status: "pending",
        })
        res.status(200).json({ count })
    }
    catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}

const checkConnection = async (req, res) => {
    try {
        const userId = req.user.userId
        const { targetId } = req.params

        if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
            return res.status(400).json({ message: "Invalid target ID" })
        }

        const connection = await Connection.findOne({
            $or: [
                { senderId: userId, receiverId: targetId },
                { senderId: targetId, receiverId: userId },
            ]
        })

        if (connection) {
            res.status(200).json({ exists: true, status: connection.status, connectionId: connection._id, isSender: connection.senderId.toString() === userId.toString() })
        } else {
            res.status(200).json({ exists: false })
        }
    }
    catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({ message: "Invalid target ID" })
        }
        console.error("check connection error:", error.message)
        res.status(500).json({ message: "Failed to check connection" })
    }
}

module.exports = {
    sendRequest,
    getReceivedRequests,
    getSentRequests,
    updateRequest,
    getPendingCount,
    checkConnection,
}
