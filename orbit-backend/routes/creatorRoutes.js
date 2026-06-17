const express = require("express");

const router = express.Router();
const { createCreatorProfile, getCreatorProfile, updateCreatorProfile
} = require("../controllers/creatorController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/onboarding",
    authMiddleware,
    createCreatorProfile
)
router.get(
    "/profile",
    authMiddleware,
    getCreatorProfile
)
router.put(
    "/save-step",
    authMiddleware,
    updateCreatorProfile,
)
console.log("Creator Routes Loaded");
module.exports = router;