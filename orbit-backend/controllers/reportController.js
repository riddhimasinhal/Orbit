const mongoose = require("mongoose");
const Report = require("../models/Report");
const User = require("../models/User");
const ModerationAuditLog = require("../models/ModerationAuditLog");

/**
 * POST /api/reports
 * Any authenticated user submits a report against another user or their content.
 */
const createReport = async (req, res) => {
    try {
        const reporterId = req.user.userId;
        const { reportedUserId, targetType, targetId, reason, description } = req.body;

        if (!reportedUserId || !mongoose.Types.ObjectId.isValid(reportedUserId)) {
            return res.status(400).json({ message: "A valid reported user ID is required" });
        }

        if (reporterId.toString() === reportedUserId.toString()) {
            return res.status(400).json({ message: "You cannot report your own account" });
        }

        if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
            return res.status(400).json({ message: "A valid target ID is required" });
        }

        const validTargetTypes = ["creator_profile", "brand_profile", "campaign", "conversation", "message", "user"];
        if (!targetType || !validTargetTypes.includes(targetType)) {
            return res.status(400).json({
                message: `Invalid targetType. Must be one of: ${validTargetTypes.join(", ")}`,
            });
        }

        const validReasons = [
            "spam",
            "harassment",
            "inappropriate_content",
            "scam_fraud",
            "impersonation",
            "terms_violation",
            "other",
        ];
        if (!reason || !validReasons.includes(reason)) {
            return res.status(400).json({
                message: `Invalid reason. Must be one of: ${validReasons.join(", ")}`,
            });
        }

        const reportedUser = await User.findById(reportedUserId);
        if (!reportedUser) {
            return res.status(404).json({ message: "Reported user not found" });
        }

        // Prevent duplicate spam reporting on the same target
        const existingReport = await Report.findOne({
            reporter: reporterId,
            targetType,
            targetId,
            status: { $in: ["pending", "under_review"] },
        });

        if (existingReport) {
            return res.status(400).json({
                message: "You have already submitted an active report for this item. Our moderation team is reviewing it.",
            });
        }

        const report = await Report.create({
            reporter: reporterId,
            reportedUser: reportedUserId,
            targetType,
            targetId,
            reason,
            description: typeof description === "string" ? description.trim() : "",
            status: "pending",
        });

        res.status(201).json({
            success: true,
            message: "Report submitted successfully. Thank you for keeping Orbit safe.",
            report,
        });
    } catch (error) {
        console.error("createReport error:", error);
        res.status(500).json({ message: "Failed to submit report" });
    }
};

/**
 * GET /api/admin/reports
 * Admin retrieves paginated moderation reports with filter options.
 */
const getReports = async (req, res) => {
    try {
        let page = parseInt(req.query.page, 10);
        let limit = parseInt(req.query.limit, 10);

        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = 15;
        if (limit > 50) limit = 50;

        const skip = (page - 1) * limit;
        const filter = {};

        if (req.query.status) {
            filter.status = req.query.status;
        }
        if (req.query.targetType) {
            filter.targetType = req.query.targetType;
        }
        if (req.query.reason) {
            filter.reason = req.query.reason;
        }

        const [total, reports] = await Promise.all([
            Report.countDocuments(filter),
            Report.find(filter)
                .populate("reporter", "name email role")
                .populate("reportedUser", "name email role status")
                .populate("reviewedBy", "name email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
        ]);

        res.status(200).json({
            success: true,
            reports,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
            },
        });
    } catch (error) {
        console.error("getReports error:", error);
        res.status(500).json({ message: "Failed to retrieve reports" });
    }
};

/**
 * GET /api/admin/reports/:reportId
 * Admin inspects a specific report.
 */
const getReportById = async (req, res) => {
    try {
        const { reportId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(reportId)) {
            return res.status(400).json({ message: "Invalid report ID" });
        }

        const report = await Report.findById(reportId)
            .populate("reporter", "name email role")
            .populate("reportedUser", "name email role status")
            .populate("reviewedBy", "name email")
            .lean();

        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }

        res.status(200).json({
            success: true,
            report,
        });
    } catch (error) {
        console.error("getReportById error:", error);
        res.status(500).json({ message: "Failed to retrieve report" });
    }
};

/**
 * PATCH /api/admin/reports/:reportId/status
 * Admin resolves, dismisses, or moves report under review.
 */
const updateReportStatus = async (req, res) => {
    try {
        const { reportId } = req.params;
        const adminId = req.user.userId;
        const { status, resolution, resolutionAction } = req.body;

        if (!mongoose.Types.ObjectId.isValid(reportId)) {
            return res.status(400).json({ message: "Invalid report ID" });
        }

        const validStatuses = ["pending", "under_review", "resolved", "dismissed"];
        if (!status || !validStatuses.includes(status)) {
            return res.status(400).json({
                message: `Status must be one of: ${validStatuses.join(", ")}`,
            });
        }

        const validActions = ["none", "content_removed", "user_warned", "user_suspended", "dismissed"];
        const action = resolutionAction && validActions.includes(resolutionAction) ? resolutionAction : "none";

        const report = await Report.findById(reportId);
        if (!report) {
            return res.status(404).json({ message: "Report not found" });
        }

        report.status = status;
        report.reviewedBy = adminId;
        report.reviewedAt = new Date();
        report.resolution = typeof resolution === "string" ? resolution.trim() : "";
        report.resolutionAction = action;

        await report.save();

        // Audit log entry
        await ModerationAuditLog.create({
            adminId,
            action: `report_${status}`,
            targetId: report._id,
            targetType: "Report",
            reason: report.resolution || `Report marked as ${status}`,
            metadata: {
                reportedUserId: report.reportedUser,
                resolutionAction: action,
            },
        });

        res.status(200).json({
            success: true,
            message: `Report marked as ${status}`,
            report,
        });
    } catch (error) {
        console.error("updateReportStatus error:", error);
        res.status(500).json({ message: "Failed to update report status" });
    }
};

module.exports = {
    createReport,
    getReports,
    getReportById,
    updateReportStatus,
};
