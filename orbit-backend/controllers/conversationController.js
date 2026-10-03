const mongoose = require("mongoose");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const Connection = require("../models/Connection");
const User = require("../models/User");
const CreatorProfile = require("../models/CreatorProfile");
const BrandProfile = require("../models/BrandProfile");

/**
 * GET /api/conversations
 * Returns conversations for the authenticated user, populated with other participant info and unread count.
 */
const getConversations = async (req, res) => {
    try {
        const userId = req.user.userId;

        const conversations = await Conversation.find({
            participants: userId,
        }).sort({ lastMessageAt: -1 });

        if (!conversations.length) {
            return res.status(200).json({ conversations: [] });
        }

        // Collect other participant IDs
        const otherParticipantIds = [];
        const conversationIds = [];
        for (const conv of conversations) {
            conversationIds.push(conv._id);
            const otherId = conv.participants.find(
                (p) => p.toString() !== userId.toString()
            );
            if (otherId && !otherParticipantIds.some((id) => id.toString() === otherId.toString())) {
                otherParticipantIds.push(otherId);
            }
        }

        // Batch fetch Users, CreatorProfiles, BrandProfiles
        const [users, creatorProfiles, brandProfiles, unreadCounts] = await Promise.all([
            User.find({ _id: { $in: otherParticipantIds } }).select("_id name fullName role email"),
            CreatorProfile.find({ userId: { $in: otherParticipantIds } }).select("userId fullName profileImage location niche"),
            BrandProfile.find({ userId: { $in: otherParticipantIds } }).select("userId companyName profileImage location"),
            Message.aggregate([
                {
                    $match: {
                        conversationId: { $in: conversationIds },
                        senderId: { $ne: new mongoose.Types.ObjectId(userId) },
                        readAt: null,
                    },
                },
                {
                    $group: {
                        _id: "$conversationId",
                        count: { $sum: 1 },
                    },
                },
            ]),
        ]);

        const userMap = new Map(users.map((u) => [u._id.toString(), u]));
        const creatorMap = new Map(creatorProfiles.map((p) => [p.userId.toString(), p]));
        const brandMap = new Map(brandProfiles.map((p) => [p.userId.toString(), p]));
        const unreadMap = new Map(unreadCounts.map((u) => [u._id.toString(), u.count]));

        const populatedConversations = conversations.map((conv) => {
            const otherId = conv.participants.find(
                (p) => p.toString() !== userId.toString()
            );
            const otherIdStr = otherId ? otherId.toString() : null;
            const otherUser = otherIdStr ? userMap.get(otherIdStr) : null;
            const creatorP = otherIdStr ? creatorMap.get(otherIdStr) : null;
            const brandP = otherIdStr ? brandMap.get(otherIdStr) : null;

            const name =
                creatorP?.fullName ||
                brandP?.companyName ||
                otherUser?.name ||
                otherUser?.fullName ||
                "Unknown User";

            const role = otherUser?.role || (creatorP ? "creator" : brandP ? "brand" : "unknown");
            const profileImage = creatorP?.profileImage || brandP?.profileImage || null;

            return {
                _id: conv._id,
                participants: conv.participants,
                otherParticipant: {
                    _id: otherIdStr,
                    name,
                    role,
                    profileImage,
                },
                lastMessage: conv.lastMessage,
                lastMessageAt: conv.lastMessageAt,
                lastSenderId: conv.lastSenderId,
                unreadCount: unreadMap.get(conv._id.toString()) || 0,
                createdAt: conv.createdAt,
                updatedAt: conv.updatedAt,
            };
        });

        res.status(200).json({ conversations: populatedConversations });
    } catch (error) {
        console.error("getConversations error:", error.message);
        res.status(500).json({ message: "Failed to retrieve conversations" });
    }
};

/**
 * POST /api/conversations
 * Body: { recipientId } or { targetUserId }
 * Creates or gets an existing conversation between two users with an accepted connection.
 */
const createOrGetConversation = async (req, res) => {
    try {
        const userId = req.user.userId;
        const recipientId = req.body.recipientId || req.body.targetUserId || req.body.participantId;

        if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
            return res.status(400).json({ message: "A valid recipient ID is required" });
        }

        if (userId.toString() === recipientId.toString()) {
            return res.status(400).json({ message: "Cannot create a conversation with yourself" });
        }

        // Verify that target user exists
        const targetUser = await User.findById(recipientId).select("_id fullName role");
        if (!targetUser) {
            return res.status(404).json({ message: "Recipient user not found" });
        }

        // Verify accepted connection exists
        const connection = await Connection.findOne({
            $or: [
                { senderId: userId, receiverId: recipientId },
                { senderId: recipientId, receiverId: userId },
            ],
            status: "accepted",
        });

        if (!connection) {
            return res.status(403).json({
                message: "Conversations are only allowed between accepted connections",
            });
        }

        // Canonical sorted participants array for uniqueness
        const sortedParticipants = [
            new mongoose.Types.ObjectId(userId),
            new mongoose.Types.ObjectId(recipientId),
        ].sort((a, b) => a.toString().localeCompare(b.toString()));

        // Check if conversation already exists
        let conversation = await Conversation.findOne({
            "participants.0": sortedParticipants[0],
            "participants.1": sortedParticipants[1],
        });

        if (!conversation) {
            // Also check using $all and $size in case existing data had different order
            conversation = await Conversation.findOne({
                participants: { $all: [userId, recipientId], $size: 2 },
            });
        }

        let isNew = false;
        if (!conversation) {
            conversation = await Conversation.create({
                participants: sortedParticipants,
                lastMessage: "",
                lastMessageAt: new Date(),
            });
            isNew = true;
        }

        // Fetch other participant profile info
        const [creatorP, brandP] = await Promise.all([
            CreatorProfile.findOne({ userId: recipientId }).select("fullName profileImage"),
            BrandProfile.findOne({ userId: recipientId }).select("companyName profileImage"),
        ]);

        const otherName =
            creatorP?.fullName ||
            brandP?.companyName ||
            targetUser?.name ||
            targetUser?.fullName ||
            "Unknown User";

        const responsePayload = {
            _id: conversation._id,
            participants: conversation.participants,
            otherParticipant: {
                _id: recipientId,
                name: otherName,
                role: targetUser.role,
                profileImage: creatorP?.profileImage || brandP?.profileImage || null,
            },
            lastMessage: conversation.lastMessage,
            lastMessageAt: conversation.lastMessageAt,
            lastSenderId: conversation.lastSenderId,
            unreadCount: 0,
            createdAt: conversation.createdAt,
            updatedAt: conversation.updatedAt,
        };

        res.status(isNew ? 201 : 200).json({ conversation: responsePayload });
    } catch (error) {
        if (error.code === 11000) {
            // Concurrency race: fetch existing
            try {
                const sorted = [req.user.userId.toString(), (req.body.recipientId || req.body.targetUserId).toString()].sort();
                const existing = await Conversation.findOne({
                    participants: { $all: sorted, $size: 2 },
                });
                if (existing) {
                    return res.status(200).json({ conversation: existing });
                }
            } catch (innerErr) {
                // fall through
            }
        }
        console.error("createOrGetConversation error:", error.message);
        res.status(500).json({ message: "Failed to initialize conversation" });
    }
};

/**
 * GET /api/conversations/:conversationId/messages
 * Retrieves messages for a conversation and marks unread messages from other user as read.
 */
const getMessages = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { conversationId } = req.params;

        if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({ message: "Invalid conversation ID" });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        const isParticipant = conversation.participants.some(
            (p) => p.toString() === userId.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({ message: "Unauthorized: You are not a participant in this conversation" });
        }

        // Pagination support
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
        const skip = (page - 1) * limit;

        const [messages, total] = await Promise.all([
            Message.find({ conversationId })
                .sort({ createdAt: 1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Message.countDocuments({ conversationId }),
        ]);

        // Mark incoming unread messages as read
        const updateResult = await Message.updateMany(
            {
                conversationId,
                senderId: { $ne: userId },
                readAt: null,
            },
            {
                $set: { readAt: new Date() },
            }
        );

        res.status(200).json({
            messages,
            pagination: {
                page,
                limit,
                total,
                hasMore: skip + messages.length < total,
            },
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({ message: "Invalid conversation ID" });
        }
        console.error("getMessages error:", error.message);
        res.status(500).json({ message: "Failed to retrieve messages" });
    }
};

/**
 * POST /api/conversations/:conversationId/messages
 * Body: { content }
 * Sends a message within a conversation.
 */
const sendMessage = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { conversationId } = req.params;
        const { content } = req.body;

        if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
            return res.status(400).json({ message: "Invalid conversation ID" });
        }

        if (!content || typeof content !== "string" || !content.trim()) {
            return res.status(400).json({ message: "Message content cannot be empty" });
        }

        if (content.trim().length > 2000) {
            return res.status(400).json({ message: "Message exceeds maximum length of 2000 characters" });
        }

        const conversation = await Conversation.findById(conversationId);
        if (!conversation) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        const isParticipant = conversation.participants.some(
            (p) => p.toString() === userId.toString()
        );
        if (!isParticipant) {
            return res.status(403).json({ message: "Unauthorized: You are not a participant in this conversation" });
        }

        // Verify active accepted connection still exists between the participants
        const otherParticipantId = conversation.participants.find(
            (p) => p.toString() !== userId.toString()
        );

        if (!otherParticipantId) {
            return res.status(400).json({ message: "Invalid conversation participants" });
        }

        const connection = await Connection.findOne({
            $or: [
                { senderId: userId, receiverId: otherParticipantId },
                { senderId: otherParticipantId, receiverId: userId },
            ],
            status: "accepted",
        });

        if (!connection) {
            return res.status(403).json({
                message: "Cannot send messages without an active accepted connection",
            });
        }

        // Always enforce req.user.userId as senderId (ignore any client-provided senderId)
        const message = await Message.create({
            conversationId,
            senderId: userId,
            content: content.trim(),
        });

        // Update conversation metadata
        conversation.lastMessage = content.trim();
        conversation.lastMessageAt = message.createdAt;
        conversation.lastSenderId = userId;
        await conversation.save();

        res.status(201).json({ message });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({ message: "Invalid resource identifier" });
        }
        console.error("sendMessage error:", error.message);
        res.status(500).json({ message: "Failed to send message" });
    }
};

module.exports = {
    getConversations,
    createOrGetConversation,
    getMessages,
    sendMessage,
};
