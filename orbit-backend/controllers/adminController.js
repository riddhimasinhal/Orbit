const mongoose = require("mongoose");
const CreatorProfile = require("../models/CreatorProfile");
const PortfolioItem = require("../models/PortfolioItem");

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

module.exports = {
    getPendingVerifications,
    approveVerification,
    rejectVerification,
};
