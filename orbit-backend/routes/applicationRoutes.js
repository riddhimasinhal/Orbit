const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const {
    getMyApplications,
    getApplicationById,
    withdrawApplication,
    acceptApplication,
    rejectApplication,
} = require("../controllers/applicationController");

// Creator: List applications submitted by current creator
router.get("/mine", authMiddleware, requireRole("creator"), getMyApplications);

// Single application details (accessible by creator owner or campaign brand owner)
router.get("/:applicationId", authMiddleware, getApplicationById);

// Creator: Withdraw a pending application
router.patch("/:applicationId/withdraw", authMiddleware, requireRole("creator"), withdrawApplication);

// Brand: Accept an application (creates a collaboration)
router.patch("/:applicationId/accept", authMiddleware, requireRole("brand"), acceptApplication);

// Brand: Reject an application
router.patch("/:applicationId/reject", authMiddleware, requireRole("brand"), rejectApplication);

module.exports = router;
