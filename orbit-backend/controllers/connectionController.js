const Connection = require("../models/Connection")
const User = require("../models/User")
const CreatorProfile = require("../models/CreatorProfile")
const BrandProfile = require("../models/BrandProfile")

const sendRequest = async (req, res) => {
    try {
        const senderId = req.user.userId
        const senderRole = req.user.role
        const { receiverId, message } = req.body

        if (!receiverId) {
            return res.status(400).json({ message: "Receiver ID is required" })
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
            senderRole,
            message: message || "",
        })

        console.log("Connection request sent:", connection._id)
        res.status(201).json({ message: "Request sent", connection })
    }
    catch (error) {
        console.log("send request error:", error)
        res.status(500).json({ message: error.message })
    }
}

const getReceivedRequests = async (req, res) => {
    try {
        const userId = req.user.userId
        const requests = await Connection.find({ receiverId: userId }).sort({ createdAt: -1 })

        // get sender details for each request
        const populated = []
        for (let i = 0; i < requests.length; i++) {
            const req_item = requests[i]
            let senderInfo = null

            if (req_item.senderRole === "creator") {
                senderInfo = await CreatorProfile.findOne({ userId: req_item.senderId })
            } else {
                senderInfo = await BrandProfile.findOne({ userId: req_item.senderId })
            }

            populated.push({
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
            })
        }

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

        const populated = []
        for (let i = 0; i < requests.length; i++) {
            const req_item = requests[i]
            let receiverInfo = null

            // sender is current user, so receiver is the opposite role
            const receiverUser = await User.findById(req_item.receiverId)
            if (receiverUser?.role === "creator") {
                receiverInfo = await CreatorProfile.findOne({ userId: req_item.receiverId })
            } else {
                receiverInfo = await BrandProfile.findOne({ userId: req_item.receiverId })
            }

            populated.push({
                _id: req_item._id,
                receiverId: req_item.receiverId,
                status: req_item.status,
                message: req_item.message,
                createdAt: req_item.createdAt,
                receiverName: receiverInfo?.fullName || receiverInfo?.companyName || "Unknown",
                receiverLocation: receiverInfo?.location || "",
                receiverRole: receiverUser?.role,
                receiverProfileId: receiverInfo?._id,
            })
        }

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

        if (status !== "accepted" && status !== "declined") {
            return res.status(400).json({ message: "Status must be accepted or declined" })
        }

        const connection = await Connection.findById(id)
        if (!connection) {
            return res.status(404).json({ message: "Request not found" })
        }

        // only receiver can accept/decline
        if (connection.receiverId.toString() !== userId) {
            return res.status(403).json({ message: "Not authorized" })
        }

        connection.status = status
        await connection.save()

        console.log("Request updated:", id, status)
        res.status(200).json({ message: "Request " + status, connection })
    }
    catch (error) {
        console.log("update request error:", error)
        res.status(500).json({ message: error.message })
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

        const connection = await Connection.findOne({
            $or: [
                { senderId: userId, receiverId: targetId },
                { senderId: targetId, receiverId: userId },
            ]
        })

        if (connection) {
            res.status(200).json({ exists: true, status: connection.status, connectionId: connection._id, isSender: connection.senderId.toString() === userId })
        } else {
            res.status(200).json({ exists: false })
        }
    }
    catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
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
