const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const {
    getContractByCollaboration,
    getContractById,
    createOrDraftContract,
    sendContract,
    acceptContract,
    rejectContract,
    reviseContract,
    withdrawContract,
} = require("../controllers/contractController");

// Get contract by collaboration ID
router.get("/collaboration/:collaborationId", authMiddleware, getContractByCollaboration);

// Get contract by its own ID
router.get("/:contractId", authMiddleware, getContractById);

// Brand drafts or creates contract
router.post("/collaboration/:collaborationId", authMiddleware, requireRole("brand"), createOrDraftContract);

// Brand sends contract for acceptance
router.post("/:contractId/send", authMiddleware, requireRole("brand"), sendContract);

// Participant accepts contract
router.post("/:contractId/accept", authMiddleware, acceptContract);

// Participant rejects contract
router.post("/:contractId/reject", authMiddleware, rejectContract);

// Brand revises contract (creates a new version)
router.post("/:contractId/revise", authMiddleware, requireRole("brand"), reviseContract);

// Brand withdraws contract proposal
router.post("/:contractId/withdraw", authMiddleware, requireRole("brand"), withdrawContract);

module.exports = router;
