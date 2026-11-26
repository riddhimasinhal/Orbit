const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const {
    getCreatorAnalytics,
    getBrandAnalytics,
    getAdminAnalytics,
} = require("../controllers/analyticsController");

router.get("/creator", authMiddleware, requireRole("creator"), getCreatorAnalytics);
router.get("/brand", authMiddleware, requireRole("brand"), getBrandAnalytics);
router.get("/admin", authMiddleware, requireRole("admin"), getAdminAnalytics);

module.exports = router;
