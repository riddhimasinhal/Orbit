const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

const {
    createCampaign,
    getMyCampaigns,
    getCampaignById,
    updateCampaign,
    publishCampaign,
    closeCampaign,
    getAllPublishedCampaigns,
} = require("../controllers/campaignController");

// Brand-specific campaign operations
router.post("/", authMiddleware, requireRole("brand"), createCampaign);
router.get("/mine", authMiddleware, requireRole("brand"), getMyCampaigns);

// Public marketplace for authenticated users (creators discovering campaigns)
router.get("/", authMiddleware, getAllPublishedCampaigns);

// Detail & lifecycle operations
router.get("/:campaignId", authMiddleware, getCampaignById);
router.put("/:campaignId", authMiddleware, requireRole("brand"), updateCampaign);
router.patch("/:campaignId/publish", authMiddleware, requireRole("brand"), publishCampaign);
router.patch("/:campaignId/close", authMiddleware, requireRole("brand"), closeCampaign);

module.exports = router;
