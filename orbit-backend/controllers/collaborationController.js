const mongoose = require("mongoose");
const Collaboration = require("../models/Collaboration");
const Campaign = require("../models/Campaign");
const Application = require("../models/Application");
const User = require("../models/User");
const Connection = require("../models/Connection");

/**
 * GET /api/collaborations/mine
 * Get collaborations for current user (creator or brand)
 * Query params: status (active, completed, cancelled), page, limit
 */
const getMyCollaborations = async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id;
        const role = req.user.role; // "creator" or "brand"
        const page = Math.max(1, parseInt(req.query.page, 10) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
        const skip = (page - 1) * limit;

        const filter = {};
        if (role === "creator") {
            filter.creatorId = userId;
        } else if (role === "brand") {
            filter.brandId = userId;
        } else {
            filter.$or = [{ creatorId: userId }, { brandId: userId }];
        }

        if (req.query.status) {
            filter.status = req.query.status;
        }

        const [total, collaborations] = await Promise.all([
            Collaboration.countDocuments(filter),
            Collaboration.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
        ]);

        if (collaborations.length === 0) {
            return res.status(200).json({
                success: true,
                collaborations: [],
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit) || 1,
                },
            });
        }

        // Batch populate campaign, brand, creator, application, and connection status
        const campaignIds = [...new Set(collaborations.map((c) => c.campaignId?.toString()).filter(Boolean))];
        const userIds = [
            ...new Set([
                ...collaborations.map((c) => c.creatorId?.toString()),
                ...collaborations.map((c) => c.brandId?.toString()),
            ].filter(Boolean)),
        ];
        const appIds = [...new Set(collaborations.map((c) => c.applicationId?.toString()).filter(Boolean))];

        const [campaigns, users, applications] = await Promise.all([
            Campaign.find({ _id: { $in: campaignIds } })
                .select("title brandName category budget coverImage status niche budgetMin budgetMax")
                .lean(),
            User.find({ _id: { $in: userIds } })
                .select("name email role")
                .lean(),
            Application.find({ _id: { $in: appIds } })
                .select("pitch proposedBudget status")
                .lean(),
        ]);

        const campaignMap = new Map(campaigns.map((c) => [c._id.toString(), c]));
        const userMap = new Map(users.map((u) => [u._id.toString(), u]));
        const appMap = new Map(applications.map((a) => [a._id.toString(), a]));

        // Batch check connections between userId and the counterparties
        const counterpartIds = collaborations.map((c) =>
            c.creatorId?.toString() === userId.toString() ? c.brandId?.toString() : c.creatorId?.toString()
        ).filter(Boolean);

        const connections = await Connection.find({
            status: "accepted",
            $or: [
                { senderId: userId, receiverId: { $in: counterpartIds } },
                { senderId: { $in: counterpartIds }, receiverId: userId },
            ],
        }).lean();

        const connectedUserSet = new Set();
        connections.forEach((conn) => {
            const s = conn.senderId.toString();
            const r = conn.receiverId.toString();
            const counterpart = s === userId.toString() ? r : s;
            connectedUserSet.add(counterpart);
        });

        const populated = collaborations.map((c) => {
            const counterpartId =
                c.creatorId?.toString() === userId.toString()
                    ? c.brandId?.toString()
                    : c.creatorId?.toString();

            return {
                ...c,
                campaign: campaignMap.get(c.campaignId?.toString()) || null,
                creator: userMap.get(c.creatorId?.toString()) || null,
                brand: userMap.get(c.brandId?.toString()) || null,
                application: appMap.get(c.applicationId?.toString()) || null,
                isConnectedWithPartner: counterpartId ? connectedUserSet.has(counterpartId) : false,
            };
        });

        return res.status(200).json({
            success: true,
            collaborations: populated,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit) || 1,
            },
        });
    } catch (error) {
        console.error("Error in getMyCollaborations:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * GET /api/collaborations/:collaborationId
 * Get a specific collaboration by ID
 */
const getCollaborationById = async (req, res) => {
    try {
        const { collaborationId } = req.params;
        const userId = req.user.userId || req.user._id;

        if (!mongoose.Types.ObjectId.isValid(collaborationId)) {
            return res.status(400).json({
                message: "Invalid collaboration ID format",
            });
        }

        const collaboration = await Collaboration.findById(collaborationId).lean();
        if (!collaboration) {
            return res.status(404).json({
                message: "Collaboration not found",
            });
        }

        // Authorization: User must be creator or brand
        const isCreator = collaboration.creatorId.toString() === userId.toString();
        const isBrand = collaboration.brandId.toString() === userId.toString();

        if (!isCreator && !isBrand) {
            return res.status(403).json({
                message: "Not authorized to access this collaboration",
            });
        }

        const counterpartId = isCreator
            ? collaboration.brandId.toString()
            : collaboration.creatorId.toString();

        const [campaign, creator, brand, application, connection] = await Promise.all([
            Campaign.findById(collaboration.campaignId)
                .select("title brandName category budget coverImage status requirements niche budgetMin budgetMax deliverables")
                .lean(),
            User.findById(collaboration.creatorId)
                .select("name email role")
                .lean(),
            User.findById(collaboration.brandId)
                .select("name email role")
                .lean(),
            Application.findById(collaboration.applicationId)
                .select("pitch proposedBudget status createdAt")
                .lean(),
            Connection.findOne({
                status: "accepted",
                $or: [
                    { senderId: userId, receiverId: counterpartId },
                    { senderId: counterpartId, receiverId: userId },
                ],
            }).lean(),
        ]);

        return res.status(200).json({
            success: true,
            collaboration: {
                ...collaboration,
                campaign: campaign || null,
                creator: creator || null,
                brand: brand || null,
                application: application || null,
                isConnectedWithPartner: !!connection,
            },
        });
    } catch (error) {
        console.error("Error in getCollaborationById:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    getMyCollaborations,
    getCollaborationById,
};
