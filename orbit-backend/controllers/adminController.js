const mongoose = require("mongoose");
const User = require("../models/User");
const CreatorProfile = require("../models/CreatorProfile");
const BrandProfile = require("../models/BrandProfile");
const PortfolioItem = require("../models/PortfolioItem");
const ModerationAuditLog = require("../models/ModerationAuditLog");
const { createNotification } = require("../services/notificationService");

/**
 * GET /api/admin/verifications
 * Admin retrieves pending creator verification requests
 */
const getPendingVerifications = async (req, res) => {
    try {
        let page = parseInt(req.query.page, 10);
        let limit = parseInt(req.query.limit, 10);

        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = 10;
        if (limit > 50) limit = 50;

        const skip = (page - 1) * limit;
        const filter = { verificationStatus: "pending" };

        const [total, requests] = await Promise.all([
            CreatorProfile.countDocuments(filter),
            CreatorProfile.find(filter)
                .populate("userId", "name email role")
                .sort({ verificationRequestedAt: 1 })
                .skip(skip)
                .limit(limit),
        ]);

        const creatorUserIds = requests
            .map((r) => (r.userId && r.userId._id ? r.userId._id : r.userId))
            .filter(Boolean);

        const portfolioCounts = await PortfolioItem.aggregate([
            { $match: { creatorId: { $in: creatorUserIds } } },
            { $group: { _id: "$creatorId", count: { $sum: 1 } } },
        ]);
        const countMap = new Map(portfolioCounts.map((p) => [p._id.toString(), p.count]));

        const enrichedRequests = requests.map((req) => {
            const obj = req.toObject ? req.toObject() : { ...req };
            const uid = (obj.userId && obj.userId._id ? obj.userId._id : obj.userId)?.toString();
            return {
                ...obj,
                portfolioCount: countMap.get(uid) || 0,
            };
        });

        res.status(200).json({
            success: true,
            requests: enrichedRequests,
            data: enrichedRequests,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
            },
        });
    } catch (error) {
        console.error("getPendingVerifications error:", error);
        res.status(500).json({
            message: error.message || "Failed to retrieve pending verification requests",
        });
    }
};

/**
 * PATCH /api/admin/verifications/:creatorId/approve
 * Admin approves a creator's verification request
 */
const approveVerification = async (req, res) => {
    try {
        const { creatorId } = req.params;
        const adminId = req.user.userId || req.user._id;

        if (!mongoose.Types.ObjectId.isValid(creatorId)) {
            return res.status(400).json({
                message: "Invalid creator ID format",
            });
        }

        // Support lookup by profile _id or creator user _id
        let profile = await CreatorProfile.findById(creatorId);
        if (!profile) {
            profile = await CreatorProfile.findOne({ userId: creatorId });
        }

        if (!profile) {
            return res.status(404).json({
                message: "Creator profile not found",
            });
        }

        if (profile.verificationStatus === "verified") {
            return res.status(400).json({
                message: "Creator is already verified",
            });
        }

        profile.verificationStatus = "verified";
        profile.verifiedAt = new Date();
        profile.verifiedBy = adminId;
        profile.verificationRejectedAt = null;
        profile.verificationRejectionReason = null;

        await profile.save();

        // Audit log
        await ModerationAuditLog.create({
            adminId,
            action: "verify_creator",
            targetId: profile.userId,
            targetType: "CreatorProfile",
            reason: "Creator verification approved",
            metadata: { profileId: profile._id },
        });

        // Notification
        createNotification({
            recipient: profile.userId,
            sender: adminId,
            type: "verification_status",
            title: "Verification Approved!",
            message: "Congratulations! Your creator profile has been verified by Orbit.",
            relatedEntity: profile._id,
            relatedEntityType: "User",
            link: "/profile",
        });

        res.status(200).json({
            success: true,
            message: "Creator verified successfully",
            creator: profile,
        });
    } catch (error) {
        console.error("approveVerification error:", error);
        res.status(500).json({
            message: error.message || "Failed to approve verification request",
        });
    }
};

/**
 * PATCH /api/admin/verifications/:creatorId/reject
 * Admin rejects a creator's verification request
 */
const rejectVerification = async (req, res) => {
    try {
        const { creatorId } = req.params;
        const adminId = req.user.userId || req.user._id;
        const { reason } = req.body;

        if (!mongoose.Types.ObjectId.isValid(creatorId)) {
            return res.status(400).json({
                message: "Invalid creator ID format",
            });
        }

        if (!reason || typeof reason !== "string" || !reason.trim()) {
            return res.status(400).json({
                message: "Rejection reason is required",
            });
        }

        // Support lookup by profile _id or creator user _id
        let profile = await CreatorProfile.findById(creatorId);
        if (!profile) {
            profile = await CreatorProfile.findOne({ userId: creatorId });
        }

        if (!profile) {
            return res.status(404).json({
                message: "Creator profile not found",
            });
        }

        if (profile.verificationStatus === "verified") {
            return res.status(400).json({
                message: "Cannot reject an already verified creator",
            });
        }

        profile.verificationStatus = "rejected";
        profile.verificationRejectedAt = new Date();
        profile.verificationRejectionReason = reason.trim();

        await profile.save();

        // Audit log
        await ModerationAuditLog.create({
            adminId,
            action: "reject_creator",
            targetId: profile.userId,
            targetType: "CreatorProfile",
            reason: reason.trim(),
            metadata: { profileId: profile._id },
        });

        // Notification
        createNotification({
            recipient: profile.userId,
            sender: adminId,
            type: "verification_status",
            title: "Verification Application Update",
            message: `Your verification request was not approved: ${reason.trim()}`,
            relatedEntity: profile._id,
            relatedEntityType: "User",
            link: "/profile",
        });

        res.status(200).json({
            success: true,
            message: "Creator verification rejected",
            creator: profile,
        });
    } catch (error) {
        console.error("rejectVerification error:", error);
        res.status(500).json({
            message: error.message || "Failed to reject verification request",
        });
    }
};

/**
 * GET /api/admin/users
 * Admin retrieves paginated user list with role, status, and profile info
 */
const getUsers = async (req, res) => {
    try {
        let page = parseInt(req.query.page, 10);
        let limit = parseInt(req.query.limit, 10);

        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = 15;
        if (limit > 50) limit = 50;

        const skip = (page - 1) * limit;
        const filter = {};

        if (req.query.role && ["creator", "brand", "admin"].includes(req.query.role)) {
            filter.role = req.query.role;
        }

        if (req.query.status && ["active", "suspended"].includes(req.query.status)) {
            filter.status = req.query.status;
        }

        if (req.query.search && typeof req.query.search === "string" && req.query.search.trim()) {
            const regex = new RegExp(req.query.search.trim(), "i");
            filter.$or = [{ name: regex }, { email: regex }];
        }

        const [total, users] = await Promise.all([
            User.countDocuments(filter),
            User.find(filter)
                .select("-password")
                .populate("suspendedBy", "name email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
        ]);

        const userIds = users.map((u) => u._id);
        const [creatorProfiles, brandProfiles] = await Promise.all([
            CreatorProfile.find({ userId: { $in: userIds } }).select("userId fullName profileImage verificationStatus").lean(),
            BrandProfile.find({ userId: { $in: userIds } }).select("userId companyName profileImage").lean(),
        ]);

        const cMap = new Map(creatorProfiles.map((p) => [p.userId.toString(), p]));
        const bMap = new Map(brandProfiles.map((p) => [p.userId.toString(), p]));

        const enrichedUsers = users.map((u) => {
            const uid = u._id.toString();
            return {
                ...u,
                creatorProfile: cMap.get(uid) || null,
                brandProfile: bMap.get(uid) || null,
            };
        });

        res.status(200).json({
            success: true,
            users: enrichedUsers,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
            },
        });
    } catch (error) {
        console.error("getUsers error:", error);
        res.status(500).json({ message: "Failed to retrieve users" });
    }
};

/**
 * PATCH /api/admin/users/:userId/suspend
 * Admin suspends an offending user
 */
const suspendUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const adminId = req.user.userId;
        const { reason } = req.body;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        if (adminId.toString() === userId.toString()) {
            return res.status(400).json({ message: "You cannot suspend your own admin account" });
        }

        if (!reason || typeof reason !== "string" || !reason.trim()) {
            return res.status(400).json({ message: "A suspension reason is required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.role === "admin") {
            return res.status(400).json({ message: "Admin accounts cannot be suspended" });
        }

        if (user.status === "suspended") {
            return res.status(400).json({ message: "User is already suspended" });
        }

        user.status = "suspended";
        user.suspendedAt = new Date();
        user.suspendedReason = reason.trim();
        user.suspendedBy = adminId;
        await user.save();

        await ModerationAuditLog.create({
            adminId,
            action: "suspend_user",
            targetId: user._id,
            targetType: "User",
            reason: reason.trim(),
            metadata: {
                userEmail: user.email,
                userRole: user.role,
            },
        });

        res.status(200).json({
            success: true,
            message: `User ${user.name} has been suspended`,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                status: user.status,
                suspendedAt: user.suspendedAt,
                suspendedReason: user.suspendedReason,
            },
        });
    } catch (error) {
        console.error("suspendUser error:", error);
        res.status(500).json({ message: "Failed to suspend user" });
    }
};

/**
 * PATCH /api/admin/users/:userId/reactivate
 * Admin reactivates a suspended user
 */
const reactivateUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const adminId = req.user.userId;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ message: "Invalid user ID" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.status !== "suspended") {
            return res.status(400).json({ message: "User is not currently suspended" });
        }

        user.status = "active";
        user.suspendedAt = null;
        user.suspendedReason = null;
        user.suspendedBy = null;
        await user.save();

        await ModerationAuditLog.create({
            adminId,
            action: "reactivate_user",
            targetId: user._id,
            targetType: "User",
            reason: "Account reactivated by administrator",
            metadata: {
                userEmail: user.email,
                userRole: user.role,
            },
        });

        createNotification({
            recipient: user._id,
            sender: adminId,
            type: "system",
            title: "Account Reactivated",
            message: "Your Orbit account has been restored to active status.",
            relatedEntity: user._id,
            relatedEntityType: "User",
            link: "/login",
        });

        res.status(200).json({
            success: true,
            message: `User ${user.name} has been reactivated`,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                status: user.status,
            },
        });
    } catch (error) {
        console.error("reactivateUser error:", error);
        res.status(500).json({ message: "Failed to reactivate user" });
    }
};

/**
 * GET /api/admin/moderation-logs
 * Admin retrieves paginated audit logs
 */
const getModerationAuditLogs = async (req, res) => {
    try {
        let page = parseInt(req.query.page, 10);
        let limit = parseInt(req.query.limit, 10);

        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = 20;
        if (limit > 50) limit = 50;

        const skip = (page - 1) * limit;
        const filter = {};

        if (req.query.action) {
            filter.action = req.query.action;
        }

        const [total, logs] = await Promise.all([
            ModerationAuditLog.countDocuments(filter),
            ModerationAuditLog.find(filter)
                .populate("adminId", "name email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
        ]);

        res.status(200).json({
            success: true,
            logs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
            },
        });
    } catch (error) {
        console.error("getModerationAuditLogs error:", error);
        res.status(500).json({ message: "Failed to retrieve moderation audit logs" });
    }
};

module.exports = {
    getPendingVerifications,
    approveVerification,
    rejectVerification,
    getUsers,
    suspendUser,
    reactivateUser,
    getModerationAuditLogs,
};
