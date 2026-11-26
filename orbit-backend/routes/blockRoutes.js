const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    blockUser,
    unblockUser,
    getBlockedUsers,
    checkBlockStatus,
} = require("../controllers/blockController");

router.get("/", authMiddleware, getBlockedUsers);
router.get("/check/:userId", authMiddleware, checkBlockStatus);
router.post("/:userId", authMiddleware, blockUser);
router.delete("/:userId", authMiddleware, unblockUser);

module.exports = router;
