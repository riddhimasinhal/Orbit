const mongoose = require("mongoose");
const Contract = require("../models/Contract");
const Collaboration = require("../models/Collaboration");
const Campaign = require("../models/Campaign");

/**
 * Helper: Validate ObjectId
 */
function isValidId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

/**
 * GET /api/contracts/collaboration/:collaborationId
 * Retrieve the current contract for a collaboration
 */
const getContractByCollaboration = async (req, res) => {
    try {
        const { collaborationId } = req.params;
        const userId = req.user.userId || req.user._id;

        if (!isValidId(collaborationId)) {
            return res.status(400).json({ message: "Invalid collaboration ID" });
        }

        const collaboration = await Collaboration.findById(collaborationId).lean();
        if (!collaboration) {
            return res.status(404).json({ message: "Collaboration not found" });
        }

        // Authorization: Only brand or creator participant can access
        const isBrand = collaboration.brandId.toString() === userId.toString();
        const isCreator = collaboration.creatorId.toString() === userId.toString();
        if (!isBrand && !isCreator) {
            return res.status(403).json({ message: "Access forbidden: you are not a participant in this collaboration" });
        }

        const contract = await Contract.findOne({ collaborationId })
            .populate("brandId", "name email role companyName")
            .populate("creatorId", "name email role")
            .populate("brandAcceptance.acceptedBy", "name email")
            .populate("creatorAcceptance.acceptedBy", "name email")
            .lean();

        return res.status(200).json({
            success: true,
            contract: contract || null,
        });
    } catch (error) {
        console.error("Error in getContractByCollaboration:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * GET /api/contracts/:contractId
 * Retrieve contract by its ID
 */
const getContractById = async (req, res) => {
    try {
        const { contractId } = req.params;
        const userId = req.user.userId || req.user._id;

        if (!isValidId(contractId)) {
            return res.status(400).json({ message: "Invalid contract ID" });
        }

        const contract = await Contract.findById(contractId)
            .populate("brandId", "name email role companyName")
            .populate("creatorId", "name email role")
            .populate("brandAcceptance.acceptedBy", "name email")
            .populate("creatorAcceptance.acceptedBy", "name email")
            .lean();

        if (!contract) {
            return res.status(404).json({ message: "Contract not found" });
        }

        // Authorization check
        const isBrand = contract.brandId._id?.toString() === userId.toString() || contract.brandId.toString() === userId.toString();
        const isCreator = contract.creatorId._id?.toString() === userId.toString() || contract.creatorId.toString() === userId.toString();
        if (!isBrand && !isCreator) {
            return res.status(403).json({ message: "Access forbidden: you are not a participant in this contract" });
        }

        return res.status(200).json({
            success: true,
            contract,
        });
    } catch (error) {
        console.error("Error in getContractById:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * POST /api/contracts/collaboration/:collaborationId
 * Brand creates or drafts a contract for a collaboration
 */
const createOrDraftContract = async (req, res) => {
    try {
        const { collaborationId } = req.params;
        const userId = req.user.userId || req.user._id;

        if (!isValidId(collaborationId)) {
            return res.status(400).json({ message: "Invalid collaboration ID" });
        }

        const collaboration = await Collaboration.findById(collaborationId);
        if (!collaboration) {
            return res.status(404).json({ message: "Collaboration not found" });
        }

        // Only the collaboration's brand can draft or create contracts
        if (collaboration.brandId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Access forbidden: only the collaboration brand can draft contracts" });
        }

        if (collaboration.status !== "active") {
            return res.status(400).json({ message: `Cannot create contracts for a ${collaboration.status} collaboration` });
        }

        // Check if a contract already exists
        const existing = await Contract.findOne({ collaborationId });
        if (existing) {
            if (existing.status === "accepted") {
                return res.status(400).json({
                    message: "An accepted contract already exists for this collaboration. Use the revision flow to create a new version.",
                });
            }
            if (existing.status === "sent") {
                return res.status(400).json({
                    message: "A contract is currently pending acceptance. Please withdraw or revise it to make changes.",
                });
            }
        }

        const {
            title,
            amount,
            currency = "INR",
            paymentTerms,
            deliverables = [],
            termsAndConditions,
            sendImmediate = false,
        } = req.body;

        if (amount === undefined || amount === null || isNaN(Number(amount)) || Number(amount) < 0) {
            return res.status(400).json({ message: "A valid positive compensation amount is required" });
        }

        const campaign = await Campaign.findById(collaboration.campaignId).lean();
        const contractTitle = title && typeof title === "string" && title.trim()
            ? title.trim()
            : (campaign?.title ? `${campaign.title} — Collaboration Contract` : "Collaboration Contract");

        // Format deliverables
        const formattedDeliverables = Array.isArray(deliverables) && deliverables.length > 0
            ? deliverables.map((d) => ({
                title: typeof d.title === "string" ? d.title.trim() : "Deliverable",
                description: typeof d.description === "string" ? d.description.trim() : "",
                dueDate: d.dueDate ? new Date(d.dueDate) : null,
            }))
            : collaboration.deliverables.map((d) => ({
                title: d.title,
                description: d.description || "",
                dueDate: d.dueDate || null,
            }));

        const initialStatus = sendImmediate ? "sent" : "draft";

        let contract;
        if (existing) {
            // Update the existing draft
            existing.title = contractTitle;
            existing.compensation = {
                amount: Number(amount),
                currency: String(currency).trim().toUpperCase(),
            };
            if (paymentTerms) existing.paymentTerms = String(paymentTerms).trim();
            existing.deliverables = formattedDeliverables;
            if (termsAndConditions) existing.termsAndConditions = String(termsAndConditions).trim();
            existing.status = initialStatus;
            if (sendImmediate) {
                // Record brand acceptance upon sending if brand chooses
                existing.brandAcceptance = {
                    accepted: true,
                    acceptedAt: new Date(),
                    acceptedBy: userId,
                };
                existing.creatorAcceptance = {
                    accepted: false,
                    acceptedAt: null,
                    acceptedBy: null,
                };
            }
            contract = await existing.save();
        } else {
            contract = await Contract.create({
                collaborationId: collaboration._id,
                campaignId: collaboration.campaignId,
                brandId: collaboration.brandId,
                creatorId: collaboration.creatorId,
                version: 1,
                status: initialStatus,
                title: contractTitle,
                compensation: {
                    amount: Number(amount),
                    currency: String(currency).trim().toUpperCase(),
                },
                paymentTerms: paymentTerms && typeof paymentTerms === "string"
                    ? paymentTerms.trim()
                    : "100% on successful completion and approval of all deliverables",
                deliverables: formattedDeliverables,
                campaignTimeline: {
                    startDate: campaign?.startDate || null,
                    endDate: campaign?.endDate || null,
                },
                termsAndConditions: termsAndConditions && typeof termsAndConditions === "string"
                    ? termsAndConditions.trim()
                    : undefined,
                brandAcceptance: sendImmediate
                    ? { accepted: true, acceptedAt: new Date(), acceptedBy: userId }
                    : { accepted: false, acceptedAt: null, acceptedBy: null },
                creatorAcceptance: { accepted: false, acceptedAt: null, acceptedBy: null },
            });
        }

        return res.status(201).json({
            success: true,
            message: sendImmediate ? "Contract sent for acceptance" : "Contract draft saved successfully",
            contract,
        });
    } catch (error) {
        console.error("Error in createOrDraftContract:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * POST /api/contracts/:contractId/send
 * Brand sends draft contract to creator for acceptance
 */
const sendContract = async (req, res) => {
    try {
        const { contractId } = req.params;
        const userId = req.user.userId || req.user._id;

        if (!isValidId(contractId)) {
            return res.status(400).json({ message: "Invalid contract ID" });
        }

        const contract = await Contract.findById(contractId);
        if (!contract) {
            return res.status(404).json({ message: "Contract not found" });
        }

        // Only brand can send contract
        if (contract.brandId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Access forbidden: only the brand can send contracts" });
        }

        if (contract.status === "accepted") {
            return res.status(400).json({ message: "Contract is already accepted" });
        }

        contract.status = "sent";
        // Brand accepts upon sending their own proposal
        contract.brandAcceptance = {
            accepted: true,
            acceptedAt: new Date(),
            acceptedBy: userId,
        };
        // Reset creator acceptance for this proposal
        contract.creatorAcceptance = {
            accepted: false,
            acceptedAt: null,
            acceptedBy: null,
        };
        contract.rejectedAt = null;
        contract.rejectedBy = null;
        contract.rejectionReason = null;
        contract.withdrawnAt = null;

        await contract.save();

        return res.status(200).json({
            success: true,
            message: "Contract sent for creator acceptance",
            contract,
        });
    } catch (error) {
        console.error("Error in sendContract:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * POST /api/contracts/:contractId/accept
 * Participant (creator or brand) accepts the contract
 */
const acceptContract = async (req, res) => {
    try {
        const { contractId } = req.params;
        const userId = req.user.userId || req.user._id;

        if (!isValidId(contractId)) {
            return res.status(400).json({ message: "Invalid contract ID" });
        }

        const contract = await Contract.findById(contractId);
        if (!contract) {
            return res.status(404).json({ message: "Contract not found" });
        }

        const isBrand = contract.brandId.toString() === userId.toString();
        const isCreator = contract.creatorId.toString() === userId.toString();

        if (!isBrand && !isCreator) {
            return res.status(403).json({ message: "Access forbidden: you are not a party to this contract" });
        }

        // Invalid transitions check
        if (contract.status === "accepted") {
            return res.status(400).json({ message: "Contract is already accepted by both parties" });
        }

        if (contract.status !== "sent") {
            return res.status(400).json({
                message: `Cannot accept contract in '${contract.status}' status. It must be sent for acceptance.`,
            });
        }

        const now = new Date();

        if (isBrand) {
            contract.brandAcceptance = {
                accepted: true,
                acceptedAt: now,
                acceptedBy: userId,
            };
        } else if (isCreator) {
            contract.creatorAcceptance = {
                accepted: true,
                acceptedAt: now,
                acceptedBy: userId,
            };
        }

        // Check if both parties have accepted the same version
        if (contract.brandAcceptance.accepted && contract.creatorAcceptance.accepted) {
            contract.status = "accepted";
        }

        await contract.save();

        const fullyAccepted = contract.status === "accepted";

        return res.status(200).json({
            success: true,
            message: fullyAccepted
                ? "Contract has been fully accepted by both parties!"
                : "Your acceptance has been recorded. Awaiting counterparty acceptance.",
            contract,
            fullyAccepted,
        });
    } catch (error) {
        console.error("Error in acceptContract:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * POST /api/contracts/:contractId/reject
 * Participant rejects the contract agreement
 */
const rejectContract = async (req, res) => {
    try {
        const { contractId } = req.params;
        const userId = req.user.userId || req.user._id;
        const { reason } = req.body;

        if (!isValidId(contractId)) {
            return res.status(400).json({ message: "Invalid contract ID" });
        }

        const contract = await Contract.findById(contractId);
        if (!contract) {
            return res.status(404).json({ message: "Contract not found" });
        }

        const isBrand = contract.brandId.toString() === userId.toString();
        const isCreator = contract.creatorId.toString() === userId.toString();

        if (!isBrand && !isCreator) {
            return res.status(403).json({ message: "Access forbidden: you are not a party to this contract" });
        }

        if (contract.status === "accepted") {
            return res.status(400).json({ message: "Cannot reject an already accepted contract" });
        }

        if (contract.status !== "sent") {
            return res.status(400).json({ message: `Cannot reject a contract with status '${contract.status}'` });
        }

        contract.status = "rejected";
        contract.rejectedAt = new Date();
        contract.rejectedBy = userId;
        contract.rejectionReason = typeof reason === "string" ? reason.trim() : null;

        await contract.save();

        return res.status(200).json({
            success: true,
            message: "Contract agreement rejected",
            contract,
        });
    } catch (error) {
        console.error("Error in rejectContract:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * POST /api/contracts/:contractId/revise
 * Brand creates a new version when terms change (requires fresh acceptance)
 */
const reviseContract = async (req, res) => {
    try {
        const { contractId } = req.params;
        const userId = req.user.userId || req.user._id;

        if (!isValidId(contractId)) {
            return res.status(400).json({ message: "Invalid contract ID" });
        }

        const contract = await Contract.findById(contractId);
        if (!contract) {
            return res.status(404).json({ message: "Contract not found" });
        }

        if (contract.brandId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Access forbidden: only the brand can revise contracts" });
        }

        const {
            title,
            amount,
            currency,
            paymentTerms,
            deliverables,
            termsAndConditions,
            sendImmediate = false,
            note = "Contract terms revised by brand",
        } = req.body;

        // Archive current snapshot into history
        const snapshot = {
            version: contract.version,
            status: contract.status,
            compensation: { ...contract.compensation.toObject() },
            paymentTerms: contract.paymentTerms,
            deliverables: contract.deliverables.map(d => ({
                title: d.title,
                description: d.description,
                dueDate: d.dueDate,
            })),
            brandAcceptance: { ...contract.brandAcceptance.toObject() },
            creatorAcceptance: { ...contract.creatorAcceptance.toObject() },
            modifiedBy: userId,
            modifiedAt: new Date(),
            note: String(note).trim(),
        };

        contract.history.push(snapshot);

        // Increment version
        contract.version += 1;

        // Update fields if provided
        if (title) contract.title = String(title).trim();
        if (amount !== undefined && amount !== null) {
            if (isNaN(Number(amount)) || Number(amount) < 0) {
                return res.status(400).json({ message: "A valid positive compensation amount is required" });
            }
            contract.compensation.amount = Number(amount);
        }
        if (currency) contract.compensation.currency = String(currency).trim().toUpperCase();
        if (paymentTerms !== undefined) contract.paymentTerms = String(paymentTerms).trim();
        if (Array.isArray(deliverables)) {
            contract.deliverables = deliverables.map((d) => ({
                title: typeof d.title === "string" ? d.title.trim() : "Deliverable",
                description: typeof d.description === "string" ? d.description.trim() : "",
                dueDate: d.dueDate ? new Date(d.dueDate) : null,
            }));
        }
        if (termsAndConditions !== undefined) {
            contract.termsAndConditions = String(termsAndConditions).trim();
        }

        // Reset acceptance for the new version
        if (sendImmediate) {
            contract.status = "sent";
            contract.brandAcceptance = {
                accepted: true,
                acceptedAt: new Date(),
                acceptedBy: userId,
            };
            contract.creatorAcceptance = {
                accepted: false,
                acceptedAt: null,
                acceptedBy: null,
            };
        } else {
            contract.status = "draft";
            contract.brandAcceptance = { accepted: false, acceptedAt: null, acceptedBy: null };
            contract.creatorAcceptance = { accepted: false, acceptedAt: null, acceptedBy: null };
        }

        contract.rejectedAt = null;
        contract.rejectedBy = null;
        contract.rejectionReason = null;
        contract.withdrawnAt = null;

        await contract.save();

        return res.status(200).json({
            success: true,
            message: sendImmediate
                ? `Contract revised to version ${contract.version} and sent for creator acceptance`
                : `Contract revised to version ${contract.version} as draft`,
            contract,
        });
    } catch (error) {
        console.error("Error in reviseContract:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

/**
 * POST /api/contracts/:contractId/withdraw
 * Brand withdraws a pending contract
 */
const withdrawContract = async (req, res) => {
    try {
        const { contractId } = req.params;
        const userId = req.user.userId || req.user._id;

        if (!isValidId(contractId)) {
            return res.status(400).json({ message: "Invalid contract ID" });
        }

        const contract = await Contract.findById(contractId);
        if (!contract) {
            return res.status(404).json({ message: "Contract not found" });
        }

        if (contract.brandId.toString() !== userId.toString()) {
            return res.status(403).json({ message: "Access forbidden: only the brand can withdraw contracts" });
        }

        if (contract.status === "accepted") {
            return res.status(400).json({ message: "Cannot withdraw an accepted contract" });
        }

        contract.status = "withdrawn";
        contract.withdrawnAt = new Date();

        await contract.save();

        return res.status(200).json({
            success: true,
            message: "Contract proposal withdrawn",
            contract,
        });
    } catch (error) {
        console.error("Error in withdrawContract:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};

module.exports = {
    getContractByCollaboration,
    getContractById,
    createOrDraftContract,
    sendContract,
    acceptContract,
    rejectContract,
    reviseContract,
    withdrawContract,
};
