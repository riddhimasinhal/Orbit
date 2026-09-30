const express = require("express");

const router = express.Router();
const { createCreatorProfile, getCreatorProfile, updateCreatorProfile, getAllCreators, getCreatorById
} = require("../controllers/creatorController");
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

router.post("/onboarding",
    authMiddleware,
    requireRole("creator"),
    createCreatorProfile
)
router.get(
    "/profile",
    authMiddleware,
    requireRole("creator"),
    getCreatorProfile
)
router.put(
    "/save-step",
    authMiddleware,
    requireRole("creator"),
    updateCreatorProfile,
)
router.get(
    "/all",
    authMiddleware,
    getAllCreators,
)
router.get(
    "/:id",
    authMiddleware,
    getCreatorById,
)
console.log("Creator Routes Loaded");
module.exports = router;