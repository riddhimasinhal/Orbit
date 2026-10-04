const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    getMyCollaborations,
    getCollaborationById,
} = require("../controllers/collaborationController");

// List collaborations for the authenticated user (creator or brand)
router.get("/mine", authMiddleware, getMyCollaborations);

// Get single collaboration details (creator or brand participant)
router.get("/:collaborationId", authMiddleware, getCollaborationById);

module.exports = router;
