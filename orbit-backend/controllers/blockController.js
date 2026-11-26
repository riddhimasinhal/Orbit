const mongoose = require("mongoose");
const Block = require("../models/Block");
const User = require("../models/User");
const CreatorProfile = require("../models/CreatorProfile");
const BrandProfile = require("../models/BrandProfile");

/**
 * POST /api/blocks/:userId
 * Authenticated user blocks another user.
 */
const blockUser = async (req, res) => {
    try {
        const blockerId = req.user.userId;
        const { userId: targetUserId } = req.params;
        const { reason } = req.body || {};

        if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        if (blockerId.toString() === targetUserId.toString()) {
            return res.status(400).json({ message: "You cannot block yourself" });
        }

        const targetUser = await User.findById(targetUserId);
        if (!targetUser) {
            return res.status(404).json({ message: "User to block not found" });
        }

        let block = await Block.findOne({
            blocker: blockerId,
            blocked: targetUserId,
        });

        if (!block) {
            block = await Block.create({
                blocker: blockerId,
                blocked: targetUserId,
                reason: typeof reason === "string" ? reason.trim() : "",
            });
        }

        res.status(200).json({
            success: true,
            message: `User ${targetUser.name} blocked successfully`,
            block,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(200).json({
                success: true,
                message: "User is already blocked",
            });
        }
        console.error("blockUser error:", error);
        res.status(500).json({ message: "Failed to block user" });
    }
};

/**
 * DELETE /api/blocks/:userId
 * Authenticated user unblocks a previously blocked user.
 */
const unblockUser = async (req, res) => {
    try {
        const blockerId = req.user.userId;
        const { userId: targetUserId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const result = await Block.findOneAndDelete({
            blocker: blockerId,
            blocked: targetUserId,
        });

        if (!result) {
            return res.status(404).json({ message: "Block record not found" });
        }

        res.status(200).json({
            success: true,
            message: "User unblocked successfully",
        });
    } catch (error) {
        console.error("unblockUser error:", error);
        res.status(500).json({ message: "Failed to unblock user" });
    }
};

/**
 * GET /api/blocks
 * Lists all users currently blocked by the authenticated user.
 */
const getBlockedUsers = async (req, res) => {
    try {
        const blockerId = req.user.userId;

        const blocks = await Block.find({ blocker: blockerId })
            .populate("blocked", "name email role status")
            .sort({ createdAt: -1 })
            .lean();

        const blockedUserIds = blocks
            .map((b) => b.blocked?._id)
            .filter(Boolean);

        const [creatorProfiles, brandProfiles] = await Promise.all([
            CreatorProfile.find({ userId: { $in: blockedUserIds } })
                .select("userId fullName profileImage niche")
                .lean(),
            BrandProfile.find({ userId: { $in: blockedUserIds } })
                .select("userId companyName profileImage")
                .lean(),
        ]);

        const creatorMap = new Map(creatorProfiles.map((p) => [p.userId.toString(), p]));
        const brandMap = new Map(brandProfiles.map((p) => [p.userId.toString(), p]));

        const enrichedBlocks = blocks.map((b) => {
            const u = b.blocked;
            const uid = u?._id?.toString();
            const cProfile = uid ? creatorMap.get(uid) : null;
            const bProfile = uid ? brandMap.get(uid) : null;

            return {
                _id: b._id,
                blockedUser: {
                    _id: u?._id,
                    name: cProfile?.fullName || bProfile?.companyName || u?.name || "User",
                    email: u?.email,
                    role: u?.role,
                    profileImage: cProfile?.profileImage || bProfile?.profileImage || null,
                },
                reason: b.reason,
                createdAt: b.createdAt,
            };
        });

        res.status(200).json({
            success: true,
            blocks: enrichedBlocks,
        });
    } catch (error) {
        console.error("getBlockedUsers error:", error);
        res.status(500).json({ message: "Failed to retrieve blocked users" });
    }
};

/**
 * GET /api/blocks/check/:userId
 * Checks whether there is an active block between the authenticated user and target user.
 */
const checkBlockStatus = async (req, res) => {
    try {
        const currentUserId = req.user.userId;
        const { userId: targetUserId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const [blockedByMe, blockedMe] = await Promise.all([
            Block.findOne({ blocker: currentUserId, blocked: targetUserId }),
            Block.findOne({ blocker: targetUserId, blocked: currentUserId }),
        ]);

        res.status(200).json({
            success: true,
            isBlocked: Boolean(blockedByMe || blockedMe),
            blockedByMe: Boolean(blockedByMe),
            blockedMe: Boolean(blockedMe),
        });
    } catch (error) {
        console.error("checkBlockStatus error:", error);
        res.status(500).json({ message: "Failed to check block status" });
    }
};

module.exports = {
    blockUser,
    unblockUser,
    getBlockedUsers,
    checkBlockStatus,
};
