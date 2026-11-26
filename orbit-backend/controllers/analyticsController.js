const mongoose = require("mongoose");
const User = require("../models/User");
const CreatorProfile = require("../models/CreatorProfile");
const BrandProfile = require("../models/BrandProfile");
const Connection = require("../models/Connection");
const Campaign = require("../models/Campaign");
const Application = require("../models/Application");
const Collaboration = require("../models/Collaboration");
const Payment = require("../models/Payment");
const Report = require("../models/Report");

/**
 * GET /api/analytics/creator
 * Authenticated creator retrieves real metrics, status breakdown, and monthly trends.
 */
const getCreatorAnalytics = async (req, res) => {
    try {
        const creatorId = new mongoose.Types.ObjectId(req.user.userId);

        const [
            connectionsCount,
            applications,
            collaborations,
            successfulPayments,
            pendingPayments,
            creatorProfile,
        ] = await Promise.all([
            Connection.countDocuments({
                $or: [{ senderId: creatorId }, { receiverId: creatorId }],
                status: "accepted",
            }),
            Application.find({ creatorId }).lean(),
            Collaboration.find({ creatorId }).lean(),
            Payment.find({ recipientId: creatorId, status: "successful", isSimulated: { $ne: true } }).lean(),
            Payment.find({ recipientId: creatorId, status: "pending", isSimulated: { $ne: true } }).lean(),
            CreatorProfile.findOne({ userId: creatorId }).lean(),
        ]);

        const totalApplications = applications.length;
        const pendingApplications = applications.filter((a) => a.status === "pending").length;
        const acceptedApplications = applications.filter((a) => a.status === "accepted").length;
        const rejectedApplications = applications.filter((a) => a.status === "rejected").length;

        const activeCollaborations = collaborations.filter((c) => c.status === "active").length;
        const completedCollaborations = collaborations.filter((c) => c.status === "completed").length;

        const totalEarnings = successfulPayments.reduce((sum, p) => sum + (p.amount || 0), 0);
        const pendingEarnings = pendingPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

        // Compute monthly earnings aggregation for last 6 months
        const monthlyEarningsMap = new Map();
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            monthlyEarningsMap.set(key, 0);
        }

        for (const payment of successfulPayments) {
            const pDate = payment.paidAt || payment.createdAt;
            if (pDate) {
                const d = new Date(pDate);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                if (monthlyEarningsMap.has(key)) {
                    monthlyEarningsMap.set(key, monthlyEarningsMap.get(key) + payment.amount);
                }
            }
        }

        const monthlyEarnings = Array.from(monthlyEarningsMap.entries()).map(([month, amount]) => ({
            month,
            earnings: amount,
        }));

        res.status(200).json({
            success: true,
            overview: {
                totalEarnings,
                pendingEarnings,
                totalApplications,
                pendingApplications,
                acceptedApplications,
                rejectedApplications,
                activeCollaborations,
                completedCollaborations,
                connectionsCount,
                verificationStatus: creatorProfile?.verificationStatus || "unverified",
            },
            monthlyEarnings,
        });
    } catch (error) {
        console.error("getCreatorAnalytics error:", error);
        res.status(500).json({ message: "Failed to load creator analytics" });
    }
};

/**
 * GET /api/analytics/brand
 * Authenticated brand retrieves campaign, spending, and collaboration metrics.
 */
const getBrandAnalytics = async (req, res) => {
    try {
        const brandId = new mongoose.Types.ObjectId(req.user.userId);

        const [
            campaigns,
            collaborations,
            successfulPayments,
            connectionsCount,
        ] = await Promise.all([
            Campaign.find({ brandId }).lean(),
            Collaboration.find({ brandId }).lean(),
            Payment.find({ payerId: brandId, status: "successful", isSimulated: { $ne: true } }).lean(),
            Connection.countDocuments({
                $or: [{ senderId: brandId }, { receiverId: brandId }],
                status: "accepted",
            }),
        ]);

        const campaignIds = campaigns.map((c) => c._id);
        const totalApplicationsReceived = await Application.countDocuments({
            campaignId: { $in: campaignIds },
        });

        const totalCampaigns = campaigns.length;
        const activeCampaigns = campaigns.filter((c) => c.status === "published").length;
        const completedCampaigns = campaigns.filter((c) => c.status === "completed").length;
        const draftCampaigns = campaigns.filter((c) => c.status === "draft").length;

        const activeCollaborations = collaborations.filter((c) => c.status === "active").length;
        const completedCollaborations = collaborations.filter((c) => c.status === "completed").length;

        const totalSpent = successfulPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

        // Compute monthly spending aggregation for last 6 months
        const monthlySpendingMap = new Map();
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            monthlySpendingMap.set(key, 0);
        }

        for (const payment of successfulPayments) {
            const pDate = payment.paidAt || payment.createdAt;
            if (pDate) {
                const d = new Date(pDate);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                if (monthlySpendingMap.has(key)) {
                    monthlySpendingMap.set(key, monthlySpendingMap.get(key) + payment.amount);
                }
            }
        }

        const monthlySpending = Array.from(monthlySpendingMap.entries()).map(([month, amount]) => ({
            month,
            spent: amount,
        }));

        res.status(200).json({
            success: true,
            overview: {
                totalSpent,
                totalCampaigns,
                activeCampaigns,
                completedCampaigns,
                draftCampaigns,
                totalApplicationsReceived,
                activeCollaborations,
                completedCollaborations,
                connectionsCount,
            },
            monthlySpending,
        });
    } catch (error) {
        console.error("getBrandAnalytics error:", error);
        res.status(500).json({ message: "Failed to load brand analytics" });
    }
};

/**
 * GET /api/analytics/admin
 * Admin retrieves platform-wide ecosystem analytics and health metrics.
 */
const getAdminAnalytics = async (req, res) => {
    try {
        const [
            totalUsers,
            creatorCount,
            brandCount,
            adminCount,
            suspendedCount,
            totalCampaigns,
            publishedCampaigns,
            totalCollaborations,
            completedCollaborations,
            successfulPayments,
            pendingVerifications,
            verifiedCreators,
            pendingReports,
            resolvedReports,
        ] = await Promise.all([
            User.countDocuments(),
            User.countDocuments({ role: "creator" }),
            User.countDocuments({ role: "brand" }),
            User.countDocuments({ role: "admin" }),
            User.countDocuments({ status: "suspended" }),
            Campaign.countDocuments(),
            Campaign.countDocuments({ status: "published" }),
            Collaboration.countDocuments(),
            Collaboration.countDocuments({ status: "completed" }),
            Payment.find({ status: "successful", isSimulated: { $ne: true } }).select("amount currency paidAt createdAt").lean(),
            CreatorProfile.countDocuments({ verificationStatus: "pending" }),
            CreatorProfile.countDocuments({ verificationStatus: "verified" }),
            Report.countDocuments({ status: "pending" }),
            Report.countDocuments({ status: "resolved" }),
        ]);

        const totalPlatformVolume = successfulPayments.reduce((sum, p) => sum + (p.amount || 0), 0);

        // Monthly platform volume for last 6 months
        const monthlyVolumeMap = new Map();
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
            monthlyVolumeMap.set(key, 0);
        }

        for (const payment of successfulPayments) {
            const pDate = payment.paidAt || payment.createdAt;
            if (pDate) {
                const d = new Date(pDate);
                const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
                if (monthlyVolumeMap.has(key)) {
                    monthlyVolumeMap.set(key, monthlyVolumeMap.get(key) + payment.amount);
                }
            }
        }

        const monthlyVolume = Array.from(monthlyVolumeMap.entries()).map(([month, volume]) => ({
            month,
            volume,
        }));

        res.status(200).json({
            success: true,
            overview: {
                totalUsers,
                creatorCount,
                brandCount,
                adminCount,
                suspendedCount,
                totalCampaigns,
                publishedCampaigns,
                totalCollaborations,
                completedCollaborations,
                totalPlatformVolume,
                pendingVerifications,
                verifiedCreators,
                pendingReports,
                resolvedReports,
            },
            monthlyVolume,
        });
    } catch (error) {
        console.error("getAdminAnalytics error:", error);
        res.status(500).json({ message: "Failed to load admin analytics" });
    }
};

module.exports = {
    getCreatorAnalytics,
    getBrandAnalytics,
    getAdminAnalytics,
};
