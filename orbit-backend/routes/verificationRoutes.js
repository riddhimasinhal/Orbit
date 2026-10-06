const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const {
    requestVerification,
    getMyVerificationStatus,
} = require("../controllers/verificationController");

// Creator endpoints
router.post(
    "/request",
    authMiddleware,
    requireRole("creator"),
    requestVerification
);

router.get(
    "/me",
    authMiddleware,
    requireRole("creator"),
    getMyVerificationStatus
);

module.exports = router;
