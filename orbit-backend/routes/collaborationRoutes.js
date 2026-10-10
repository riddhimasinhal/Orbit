const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
    getMyCollaborations,
    getCollaborationById,
    addDeliverable,
    updateDeliverable,
    deleteDeliverable,
    submitDeliverable,
    approveDeliverable,
    requestDeliverableRevision,
} = require("../controllers/collaborationController");

// List collaborations for the authenticated user (creator or brand)
router.get("/mine", authMiddleware, getMyCollaborations);

// Get single collaboration workspace details (creator or brand participant)
router.get("/:collaborationId", authMiddleware, getCollaborationById);

// Brand: Add deliverable to collaboration
router.post("/:collaborationId/deliverables", authMiddleware, addDeliverable);

// Brand: Update deliverable requirements
router.put("/:collaborationId/deliverables/:deliverableId", authMiddleware, updateDeliverable);

// Brand: Remove deliverable from collaboration
router.delete("/:collaborationId/deliverables/:deliverableId", authMiddleware, deleteDeliverable);

// Creator: Submit or resubmit work for a deliverable
router.post("/:collaborationId/deliverables/:deliverableId/submit", authMiddleware, submitDeliverable);
router.patch("/:collaborationId/deliverables/:deliverableId/submit", authMiddleware, submitDeliverable);

// Brand: Approve submitted deliverable
router.post("/:collaborationId/deliverables/:deliverableId/approve", authMiddleware, approveDeliverable);
router.patch("/:collaborationId/deliverables/:deliverableId/approve", authMiddleware, approveDeliverable);

// Brand: Request revision with feedback
router.post("/:collaborationId/deliverables/:deliverableId/request-revision", authMiddleware, requestDeliverableRevision);
router.patch("/:collaborationId/deliverables/:deliverableId/request-revision", authMiddleware, requestDeliverableRevision);
// Alias without hyphen for compatibility
router.post("/:collaborationId/deliverables/:deliverableId/revision", authMiddleware, requestDeliverableRevision);
router.patch("/:collaborationId/deliverables/:deliverableId/revision", authMiddleware, requestDeliverableRevision);

module.exports = router;
