const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const {
    getPendingVerifications,
    approveVerification,
    rejectVerification,
    getUsers,
    suspendUser,
    reactivateUser,
    getModerationAuditLogs,
} = require("../controllers/adminController");

// Verification management
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

// User management & suspension
router.get(
    "/users",
    authMiddleware,
    requireRole("admin"),
    getUsers
);

router.patch(
    "/users/:userId/suspend",
    authMiddleware,
    requireRole("admin"),
    suspendUser
);

router.patch(
    "/users/:userId/reactivate",
    authMiddleware,
    requireRole("admin"),
    reactivateUser
);

// Moderation audit logs
router.get(
    "/moderation-logs",
    authMiddleware,
    requireRole("admin"),
    getModerationAuditLogs
);

module.exports = router;
