const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const {
    getPendingVerifications,
    approveVerification,
    rejectVerification,
} = require("../controllers/adminController");

// Admin-only verification routes
router.get(
    "/verifications",
    authMiddleware,
    requireRole("admin"),
    getPendingVerifications
);

router.patch(
    "/verifications/:creatorId/approve",
    authMiddleware,
    requireRole("admin"),
    approveVerification
);

router.patch(
    "/verifications/:creatorId/reject",
    authMiddleware,
    requireRole("admin"),
    rejectVerification
);

module.exports = router;
