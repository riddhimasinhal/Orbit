const express = require("express");

const router = express.Router();
const { createCreatorProfile, getCreatorProfile, updateCreatorProfile, getAllCreators, getCreatorById
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