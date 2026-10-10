const mongoose = require("mongoose");
const Collaboration = require("../models/Collaboration");
const Campaign = require("../models/Campaign");
const Application = require("../models/Application");
const User = require("../models/User");
const Connection = require("../models/Connection");

/**
 * Helper to compute progress metrics and enrich deliverables with isOverdue
 */
function computeDeliverablesProgress(deliverables = []) {
    const now = new Date();
    const total = deliverables.length;
    const approved = deliverables.filter((d) => d.status === "approved").length;
    const submitted = deliverables.filter((d) => d.status === "submitted").length;
    const revisionRequested = deliverables.filter((d) => d.status === "revision_requested").length;
    const pending = deliverables.filter((d) => d.status === "pending").length;
    const overdue = deliverables.filter(
        (d) => d.status !== "approved" && d.dueDate && new Date(d.dueDate) < now
    ).length;
    const percentage = total > 0 ? Math.round((approved / total) * 100) : 0;

    const enriched = deliverables.map((d) => {
        const obj = d.toObject ? d.toObject() : { ...d };
        return {
            ...obj,
            isOverdue: Boolean(obj.status !== "approved" && obj.dueDate && new Date(obj.dueDate) < now),
        };
    });

    return {
        enrichedDeliverables: enriched,
        progress: {
            total,
            approved,
            submitted,
            revisionRequested,
            pending,
            overdue,
            percentage,
            completionPercentage: percentage,
        },
    };
}

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

            const { enrichedDeliverables, progress } = computeDeliverablesProgress(c.deliverables || []);

            return {
                ...c,
                campaign: campaignMap.get(c.campaignId?.toString()) || null,
                creator: userMap.get(c.creatorId?.toString()) || null,
                brand: userMap.get(c.brandId?.toString()) || null,
                application: appMap.get(c.applicationId?.toString()) || null,
                isConnectedWithPartner: counterpartId ? connectedUserSet.has(counterpartId) : false,
                deliverables: enrichedDeliverables,
                progress,
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
                .select("title brandName category budget coverImage status requirements niche budgetMin budgetMax deliverables startDate endDate")
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

        const { enrichedDeliverables, progress } = computeDeliverablesProgress(collaboration.deliverables || []);

        return res.status(200).json({
            success: true,
            collaboration: {
                ...collaboration,
                campaign: campaign || null,
                creator: creator || null,
                brand: brand || null,
                application: application || null,
                isConnectedWithPartner: !!connection,
                deliverables: enrichedDeliverables,
                progress,
            },
        });
    } catch (error) {
        console.error("Error in getCollaborationById:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * POST /api/collaborations/:collaborationId/deliverables
 * Brand creates/adds a deliverable to their collaboration
 */
const addDeliverable = async (req, res) => {
    try {
        const { collaborationId } = req.params;
        const userId = req.user.userId || req.user._id;

        if (!mongoose.Types.ObjectId.isValid(collaborationId)) {
            return res.status(400).json({ message: "Invalid collaboration ID format" });
        }

        const collaboration = await Collaboration.findById(collaborationId);
        if (!collaboration) {
            return res.status(404).json({ message: "Collaboration not found" });
        }

        // Ownership: Only owning brand can configure deliverables
        if (collaboration.brandId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Access forbidden: only the owning brand can configure deliverables" });
        }

        if (collaboration.status !== "active") {
            return res.status(400).json({ message: `Cannot modify deliverables on a ${collaboration.status} collaboration` });
        }

        const { title, description, dueDate } = req.body;
        if (!title || typeof title !== "string" || !title.trim()) {
            return res.status(400).json({ message: "Deliverable title is required" });
        }

        let parsedDueDate = null;
        if (dueDate) {
            parsedDueDate = new Date(dueDate);
            if (isNaN(parsedDueDate.getTime())) {
                return res.status(400).json({ message: "Invalid due date format" });
            }
        }

        const newDeliverable = {
            title: title.trim(),
            description: typeof description === "string" ? description.trim() : "",
            dueDate: parsedDueDate,
            status: "pending",
        };

        collaboration.deliverables.push(newDeliverable);
        await collaboration.save();

        const added = collaboration.deliverables[collaboration.deliverables.length - 1];
        const { progress } = computeDeliverablesProgress(collaboration.deliverables);

        return res.status(201).json({
            success: true,
            message: "Deliverable added successfully",
            deliverable: added,
            deliverables: collaboration.deliverables,
            progress,
        });
    } catch (error) {
        console.error("Error in addDeliverable:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * PUT /api/collaborations/:collaborationId/deliverables/:deliverableId
 * Brand updates an existing deliverable's configuration (title, description, dueDate)
 */
const updateDeliverable = async (req, res) => {
    try {
        const { collaborationId, deliverableId } = req.params;
        const userId = req.user.userId || req.user._id;

        if (!mongoose.Types.ObjectId.isValid(collaborationId) || !mongoose.Types.ObjectId.isValid(deliverableId)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const collaboration = await Collaboration.findById(collaborationId);
        if (!collaboration) {
            return res.status(404).json({ message: "Collaboration not found" });
        }

        if (collaboration.brandId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Access forbidden: only the owning brand can update deliverables" });
        }

        if (collaboration.status !== "active") {
            return res.status(400).json({ message: `Cannot modify deliverables on a ${collaboration.status} collaboration` });
        }

        const deliverable = collaboration.deliverables.id(deliverableId);
        if (!deliverable) {
            return res.status(404).json({ message: "Deliverable not found" });
        }

        const { title, description, dueDate } = req.body;
        if (title !== undefined) {
            if (typeof title !== "string" || !title.trim()) {
                return res.status(400).json({ message: "Deliverable title cannot be empty" });
            }
            deliverable.title = title.trim();
        }

        if (description !== undefined) {
            deliverable.description = typeof description === "string" ? description.trim() : "";
        }

        if (dueDate !== undefined) {
            if (dueDate === null || dueDate === "") {
                deliverable.dueDate = null;
            } else {
                const parsedDate = new Date(dueDate);
                if (isNaN(parsedDate.getTime())) {
                    return res.status(400).json({ message: "Invalid due date format" });
                }
                deliverable.dueDate = parsedDate;
            }
        }

        await collaboration.save();
        const { progress } = computeDeliverablesProgress(collaboration.deliverables);

        return res.status(200).json({
            success: true,
            message: "Deliverable updated successfully",
            deliverable,
            progress,
        });
    } catch (error) {
        console.error("Error in updateDeliverable:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * DELETE /api/collaborations/:collaborationId/deliverables/:deliverableId
 * Brand removes a deliverable from their collaboration
 */
const deleteDeliverable = async (req, res) => {
    try {
        const { collaborationId, deliverableId } = req.params;
        const userId = req.user.userId || req.user._id;

        if (!mongoose.Types.ObjectId.isValid(collaborationId) || !mongoose.Types.ObjectId.isValid(deliverableId)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const collaboration = await Collaboration.findById(collaborationId);
        if (!collaboration) {
            return res.status(404).json({ message: "Collaboration not found" });
        }

        if (collaboration.brandId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Access forbidden: only the owning brand can delete deliverables" });
        }

        if (collaboration.status !== "active") {
            return res.status(400).json({ message: `Cannot modify deliverables on a ${collaboration.status} collaboration` });
        }

        const deliverable = collaboration.deliverables.id(deliverableId);
        if (!deliverable) {
            return res.status(404).json({ message: "Deliverable not found" });
        }

        if (deliverable.status === "approved") {
            return res.status(400).json({ message: "Cannot delete an approved deliverable" });
        }

        collaboration.deliverables.pull(deliverableId);
        await collaboration.save();
        const { progress } = computeDeliverablesProgress(collaboration.deliverables);

        return res.status(200).json({
            success: true,
            message: "Deliverable removed successfully",
            progress,
        });
    } catch (error) {
        console.error("Error in deleteDeliverable:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * POST /api/collaborations/:collaborationId/deliverables/:deliverableId/submit
 * Creator submits or resubmits work for a deliverable
 */
const submitDeliverable = async (req, res) => {
    try {
        const { collaborationId, deliverableId } = req.params;
        const userId = req.user.userId || req.user._id;

        if (!mongoose.Types.ObjectId.isValid(collaborationId) || !mongoose.Types.ObjectId.isValid(deliverableId)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const collaboration = await Collaboration.findById(collaborationId);
        if (!collaboration) {
            return res.status(404).json({ message: "Collaboration not found" });
        }

        // Ownership: Only the assigned creator can submit work
        if (collaboration.creatorId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Access forbidden: only the assigned creator can submit work" });
        }

        if (collaboration.status !== "active") {
            return res.status(400).json({ message: `Cannot submit deliverables for a ${collaboration.status} collaboration` });
        }

        const deliverable = collaboration.deliverables.id(deliverableId);
        if (!deliverable) {
            return res.status(404).json({ message: "Deliverable not found" });
        }

        // Lifecycle check: Can only submit if pending or revision_requested
        if (deliverable.status === "approved") {
            return res.status(400).json({ message: "Cannot submit work for an already approved deliverable" });
        }

        const { submissionUrl, submissionNotes } = req.body;
        if (!submissionUrl || typeof submissionUrl !== "string" || !submissionUrl.trim()) {
            return res.status(400).json({ message: "A valid submission URL or media reference is required" });
        }

        deliverable.submissionUrl = submissionUrl.trim();
        deliverable.submissionNotes = typeof submissionNotes === "string" ? submissionNotes.trim() : "";
        deliverable.status = "submitted";
        deliverable.submittedAt = new Date();

        await collaboration.save();
        const { progress } = computeDeliverablesProgress(collaboration.deliverables);

        return res.status(200).json({
            success: true,
            message: "Deliverable submitted successfully",
            deliverable,
            progress,
        });
    } catch (error) {
        console.error("Error in submitDeliverable:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * POST /api/collaborations/:collaborationId/deliverables/:deliverableId/approve
 * Brand approves a submitted deliverable
 */
const approveDeliverable = async (req, res) => {
    try {
        const { collaborationId, deliverableId } = req.params;
        const userId = req.user.userId || req.user._id;

        if (!mongoose.Types.ObjectId.isValid(collaborationId) || !mongoose.Types.ObjectId.isValid(deliverableId)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const collaboration = await Collaboration.findById(collaborationId);
        if (!collaboration) {
            return res.status(404).json({ message: "Collaboration not found" });
        }

        // Creator cannot approve their own deliverable
        if (collaboration.creatorId.toString() === userId.toString()) {
            return res.status(403).json({ message: "Creators cannot approve their own submissions" });
        }

        // Only owning brand can approve
        if (collaboration.brandId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Access forbidden: only the owning brand can approve deliverables" });
        }

        if (collaboration.status !== "active") {
            return res.status(400).json({ message: `Cannot approve deliverables on a ${collaboration.status} collaboration` });
        }

        const deliverable = collaboration.deliverables.id(deliverableId);
        if (!deliverable) {
            return res.status(404).json({ message: "Deliverable not found" });
        }

        // Lifecycle check: Can only approve submitted work
        if (deliverable.status !== "submitted") {
            return res.status(400).json({
                message: `Cannot approve deliverable with status '${deliverable.status}'. It must be submitted first.`,
            });
        }

        deliverable.status = "approved";
        deliverable.approvedAt = new Date();

        await collaboration.save();
        const { progress } = computeDeliverablesProgress(collaboration.deliverables);

        return res.status(200).json({
            success: true,
            message: "Deliverable approved successfully",
            deliverable,
            progress,
        });
    } catch (error) {
        console.error("Error in approveDeliverable:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * POST /api/collaborations/:collaborationId/deliverables/:deliverableId/request-revision
 * Brand requests revisions with mandatory feedback message
 */
const requestDeliverableRevision = async (req, res) => {
    try {
        const { collaborationId, deliverableId } = req.params;
        const userId = req.user.userId || req.user._id;

        if (!mongoose.Types.ObjectId.isValid(collaborationId) || !mongoose.Types.ObjectId.isValid(deliverableId)) {
            return res.status(400).json({ message: "Invalid ID format" });
        }

        const collaboration = await Collaboration.findById(collaborationId);
        if (!collaboration) {
            return res.status(404).json({ message: "Collaboration not found" });
        }

        if (collaboration.brandId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Access forbidden: only the owning brand can request revisions" });
        }

        if (collaboration.status !== "active") {
            return res.status(400).json({ message: `Cannot request revisions on a ${collaboration.status} collaboration` });
        }

        const deliverable = collaboration.deliverables.id(deliverableId);
        if (!deliverable) {
            return res.status(404).json({ message: "Deliverable not found" });
        }

        // Lifecycle check: Can only request revision on submitted work
        if (deliverable.status !== "submitted") {
            return res.status(400).json({
                message: `Cannot request revisions on deliverable with status '${deliverable.status}'. It must be submitted first.`,
            });
        }

        const { feedback, revisionFeedback } = req.body;
        const feedbackText = feedback || revisionFeedback;

        if (!feedbackText || typeof feedbackText !== "string" || !feedbackText.trim()) {
            return res.status(400).json({ message: "Revision feedback message is required" });
        }

        deliverable.status = "revision_requested";
        deliverable.revisionFeedback = feedbackText.trim();
        deliverable.revisionRequestedAt = new Date();

        await collaboration.save();
        const { progress } = computeDeliverablesProgress(collaboration.deliverables);

        return res.status(200).json({
            success: true,
            message: "Revision requested successfully",
            deliverable,
            progress,
        });
    } catch (error) {
        console.error("Error in requestDeliverableRevision:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    getMyCollaborations,
    getCollaborationById,
    addDeliverable,
    updateDeliverable,
    deleteDeliverable,
    submitDeliverable,
    approveDeliverable,
    requestDeliverableRevision,
};
