const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const {
    createReport,
    getReports,
    getReportById,
    updateReportStatus,
} = require("../controllers/reportController");

// User submission
router.post("/", authMiddleware, createReport);

// Admin moderation
router.get("/admin/all", authMiddleware, requireRole("admin"), getReports);
router.get("/admin/:reportId", authMiddleware, requireRole("admin"), getReportById);
router.patch("/admin/:reportId/status", authMiddleware, requireRole("admin"), updateReportStatus);

module.exports = router;
