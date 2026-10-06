const CreatorProfile = require("../models/CreatorProfile");

/**
 * POST /api/verification/request
 * Authenticated creator requests profile verification
 */
const requestVerification = async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id;

        const profile = await CreatorProfile.findOne({ userId });
        if (!profile) {
            return res.status(404).json({
                message: "Creator profile not found",
            });
        }

        // Check current verification status
        if (profile.verificationStatus === "verified") {
            return res.status(400).json({
                message: "Creator is already verified",
            });
        }

        if (profile.verificationStatus === "pending") {
            return res.status(400).json({
                message: "Verification request is already pending",
            });
        }

        // unverified or rejected -> pending
        profile.verificationStatus = "pending";
        profile.verificationRequestedAt = new Date();
        await profile.save();

        res.status(200).json({
            success: true,
            message: "Verification request submitted successfully",
            status: profile.verificationStatus,
            verificationStatus: profile.verificationStatus,
            requestedAt: profile.verificationRequestedAt,
            verificationRequestedAt: profile.verificationRequestedAt,
        });
    } catch (error) {
        console.error("requestVerification error:", error);
        res.status(500).json({
            message: error.message || "Failed to submit verification request",
        });
    }
};

/**
 * GET /api/verification/me
 * Authenticated creator retrieves their own verification status
 */
const getMyVerificationStatus = async (req, res) => {
    try {
        const userId = req.user.userId || req.user._id;

        const profile = await CreatorProfile.findOne({ userId });
        if (!profile) {
            return res.status(404).json({
                message: "Creator profile not found",
            });
        }

        res.status(200).json({
            status: profile.verificationStatus || "unverified",
            verificationStatus: profile.verificationStatus || "unverified",
            requestedAt: profile.verificationRequestedAt || null,
            verifiedAt: profile.verifiedAt || null,
            rejectionReason: profile.verificationRejectionReason || null,
        });
    } catch (error) {
        console.error("getMyVerificationStatus error:", error);
        res.status(500).json({
            message: error.message || "Failed to retrieve verification status",
        });
    }
};

module.exports = {
    requestVerification,
    getMyVerificationStatus,
};
