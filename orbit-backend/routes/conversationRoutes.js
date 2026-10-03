const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    getConversations,
    createOrGetConversation,
    getMessages,
    sendMessage,
} = require("../controllers/conversationController");

// Base path: /api/conversations
router.get("/", authMiddleware, getConversations);
router.post("/", authMiddleware, createOrGetConversation);
router.get("/:conversationId/messages", authMiddleware, getMessages);
router.post("/:conversationId/messages", authMiddleware, sendMessage);

module.exports = router;
