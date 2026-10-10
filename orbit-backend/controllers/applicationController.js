const mongoose = require("mongoose");
const Application = require("../models/Application");
const Campaign = require("../models/Campaign");
const Collaboration = require("../models/Collaboration");
const CreatorProfile = require("../models/CreatorProfile");
const BrandProfile = require("../models/BrandProfile");
const User = require("../models/User");

/**
 * POST /api/campaigns/:campaignId/applications
 * Authenticated creator applies to a published campaign.
 */
const applyToCampaign = async (req, res) => {
    try {
        const creatorId = req.user.userId;
        const { campaignId } = req.params;
        const { pitch, proposedBudget } = req.body;

        if (!mongoose.Types.ObjectId.isValid(campaignId)) {
            return res.status(400).json({ message: "Invalid campaign ID" });
        }

        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Only published campaigns accept applications
        if (campaign.status !== "published") {
            return res.status(400).json({
                message: `Cannot apply to this campaign because it is ${campaign.status}`,
            });
        }

        // Enforce application deadline if set
        if (campaign.applicationDeadline) {
            const now = new Date();
            const deadline = new Date(campaign.applicationDeadline);
            if (deadline < now) {
                return res.status(400).json({
                    message: "The application deadline for this campaign has passed",
                });
            }
        }

        // Validate pitch
        if (!pitch || typeof pitch !== "string" || !pitch.trim()) {
            return res.status(400).json({ message: "A pitch proposal is required" });
        }
        if (pitch.trim().length < 10) {
            return res.status(400).json({ message: "Pitch must be at least 10 characters long" });
        }
        if (pitch.trim().length > 3000) {
            return res.status(400).json({
                message: "Pitch cannot exceed 3000 characters",
            });
        }

        // Validate proposed budget if provided
        let budget = null;
        if (proposedBudget !== undefined && proposedBudget !== null && proposedBudget !== "") {
            const num = Number(proposedBudget);
            if (isNaN(num) || num < 0) {
                return res.status(400).json({ message: "Proposed budget must be a positive number" });
            }
            budget = num;
        }

        // Check for duplicate application
        const existing = await Application.findOne({ campaignId, creatorId });
        if (existing) {
            return res.status(400).json({
                message: "You have already applied to this campaign",
            });
        }

        const application = await Application.create({
            campaignId,
            creatorId,
            pitch: pitch.trim(),
            proposedBudget: budget,
            status: "pending",
        });

        res.status(201).json({
            message: "Application submitted successfully",
            application,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: "You have already applied to this campaign",
            });
        }
        console.error("applyToCampaign error:", error.message);
        res.status(500).json({ message: "Failed to submit application" });
    }
};

/**
 * GET /api/applications/mine
 * Authenticated creator retrieves their submitted applications.
 */
const getMyApplications = async (req, res) => {
    try {
        const creatorId = req.user.userId;
        const { status } = req.query;

        const filter = { creatorId };
        if (status && ["pending", "accepted", "rejected", "withdrawn"].includes(status)) {
            filter.status = status;
        }

        let page = parseInt(req.query.page, 10);
        let limit = parseInt(req.query.limit, 10);
        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = 10;
        if (limit > 50) limit = 50;

        const skip = (page - 1) * limit;

        const [total, applications] = await Promise.all([
            Application.countDocuments(filter),
            Application.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        ]);

        if (applications.length === 0) {
            return res.status(200).json({
                applications: [],
                pagination: { page, limit, total: 0, totalPages: 1 },
            });
        }

        // Batch populate campaigns & brand profiles without N+1
        const campaignIds = [...new Set(applications.map((a) => a.campaignId.toString()))];
        const campaigns = await Campaign.find({ _id: { $in: campaignIds } }).lean();
        const campaignMap = new Map(campaigns.map((c) => [c._id.toString(), c]));

        const brandIds = [...new Set(campaigns.map((c) => c.brandId.toString()))];
        const [brandProfiles, brandUsers] = await Promise.all([
            BrandProfile.find({ userId: { $in: brandIds } }).lean(),
            User.find({ _id: { $in: brandIds } }).select("name email").lean(),
        ]);

        const brandProfileMap = new Map(brandProfiles.map((p) => [p.userId.toString(), p]));
        const brandUserMap = new Map(brandUsers.map((u) => [u._id.toString(), u]));

        const populated = applications.map((app) => {
            const camp = campaignMap.get(app.campaignId.toString());
            const brandProfile = camp ? brandProfileMap.get(camp.brandId.toString()) : null;
            const brandUser = camp ? brandUserMap.get(camp.brandId.toString()) : null;

            return {
                ...app,
                campaign: camp
                    ? {
                          _id: camp._id,
                          title: camp.title,
                          status: camp.status,
                          budgetMin: camp.budgetMin,
                          budgetMax: camp.budgetMax,
                          applicationDeadline: camp.applicationDeadline,
                          startDate: camp.startDate,
                          endDate: camp.endDate,
                          deliverables: camp.deliverables,
                          brand: {
                              userId: camp.brandId,
                              companyName: brandProfile?.companyName || brandUser?.name || "Brand",
                              industry: brandProfile?.industry || "",
                              location: brandProfile?.location || "",
                          },
                      }
                    : null,
            };
        });

        res.status(200).json({
            applications: populated,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
            },
        });
    } catch (error) {
        console.error("getMyApplications error:", error.message);
        res.status(500).json({ message: "Failed to retrieve applications" });
    }
};

/**
 * GET /api/campaigns/:campaignId/applications
 * Brand views applications for their own campaign.
 */
const getCampaignApplications = async (req, res) => {
    try {
        const brandId = req.user.userId;
        const { campaignId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(campaignId)) {
            return res.status(400).json({ message: "Invalid campaign ID" });
        }

        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Only campaign owner can view applications
        if (campaign.brandId.toString() !== brandId.toString()) {
            return res.status(403).json({
                message: "Access forbidden: you do not own this campaign",
            });
        }

        const applications = await Application.find({ campaignId })
            .sort({ createdAt: -1 })
            .lean();

        if (applications.length === 0) {
            return res.status(200).json({
                applications: [],
                campaign: {
                    _id: campaign._id,
                    title: campaign.title,
                    status: campaign.status,
                },
            });
        }

        // Batch populate creator profiles without N+1
        const creatorIds = [...new Set(applications.map((a) => a.creatorId.toString()))];
        const [creatorProfiles, creatorUsers] = await Promise.all([
            CreatorProfile.find({ userId: { $in: creatorIds } })
                .select("-verifiedBy -verificationRejectionReason -verificationRejectedAt")
                .lean(),
            User.find({ _id: { $in: creatorIds } }).select("name email").lean(),
        ]);

        const profileMap = new Map(creatorProfiles.map((p) => [p.userId.toString(), p]));
        const userMap = new Map(creatorUsers.map((u) => [u._id.toString(), u]));

        const populated = applications.map((app) => {
            const profile = profileMap.get(app.creatorId.toString());
            const user = userMap.get(app.creatorId.toString());

            return {
                ...app,
                creator: {
                    userId: app.creatorId,
                    name: user?.name || profile?.fullName || "Creator",
                    fullName: profile?.fullName || user?.name || "Creator",
                    email: user?.email || "",
                    username: profile?.username || "",
                    handle: profile?.handle || "",
                    bio: profile?.bio || "",
                    niche: profile?.niche || [],
                    location: profile?.location || "",
                    instagramFollowers: profile?.instagramFollowers || 0,
                    youtubeSubscribers: profile?.youtubeSubscribers || 0,
                    averageViews: profile?.averageViews || 0,
                },
                creatorProfile: profile || null,
            };
        });

        res.status(200).json({
            applications: populated,
            campaign: {
                _id: campaign._id,
                title: campaign.title,
                status: campaign.status,
            },
        });
    } catch (error) {
        console.error("getCampaignApplications error:", error.message);
        res.status(500).json({ message: "Failed to retrieve campaign applications" });
    }
};

/**
 * GET /api/applications/:applicationId
 * Detailed application view for creator or campaign-owning brand.
 */
const getApplicationById = async (req, res) => {
    try {
        const { applicationId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(applicationId)) {
            return res.status(400).json({ message: "Invalid application ID" });
        }

        const application = await Application.findById(applicationId).lean();
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        const campaign = await Campaign.findById(application.campaignId).lean();
        if (!campaign) {
            return res.status(404).json({ message: "Associated campaign not found" });
        }

        const isApplicant = application.creatorId.toString() === req.user.userId.toString();
        const isCampaignOwner = campaign.brandId.toString() === req.user.userId.toString();

        if (!isApplicant && !isCampaignOwner) {
            return res.status(403).json({
                message: "Access forbidden: you do not have permission to view this application",
            });
        }

        // Populate creator and brand info
        const [creatorProfile, creatorUser, brandProfile, brandUser] = await Promise.all([
            CreatorProfile.findOne({ userId: application.creatorId })
                .select("-verifiedBy -verificationRejectionReason -verificationRejectedAt")
                .lean(),
            User.findById(application.creatorId).select("name email").lean(),
            BrandProfile.findOne({ userId: campaign.brandId }).lean(),
            User.findById(campaign.brandId).select("name email").lean(),
        ]);

        const populated = {
            ...application,
            campaign: {
                _id: campaign._id,
                title: campaign.title,
                status: campaign.status,
                budgetMin: campaign.budgetMin,
                budgetMax: campaign.budgetMax,
                deliverables: campaign.deliverables,
                applicationDeadline: campaign.applicationDeadline,
                startDate: campaign.startDate,
                endDate: campaign.endDate,
                brand: {
                    userId: campaign.brandId,
                    companyName: brandProfile?.companyName || brandUser?.name || "Brand",
                    industry: brandProfile?.industry || "",
                    location: brandProfile?.location || "",
                },
            },
            creator: {
                userId: application.creatorId,
                name: creatorUser?.name || creatorProfile?.fullName || "Creator",
                fullName: creatorProfile?.fullName || creatorUser?.name || "Creator",
                email: creatorUser?.email || "",
                username: creatorProfile?.username || "",
                niche: creatorProfile?.niche || [],
                location: creatorProfile?.location || "",
            },
        };

        res.status(200).json({ application: populated });
    } catch (error) {
        console.error("getApplicationById error:", error.message);
        res.status(500).json({ message: "Failed to retrieve application" });
    }
};

/**
 * PATCH /api/applications/:applicationId/withdraw
 * Authenticated creator withdraws their pending application.
 */
const withdrawApplication = async (req, res) => {
    try {
        const { applicationId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(applicationId)) {
            return res.status(400).json({ message: "Invalid application ID" });
        }

        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        // Ownership check
        if (application.creatorId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({
                message: "Access forbidden: you do not own this application",
            });
        }

        // Strict lifecycle check
        if (application.status !== "pending") {
            return res.status(400).json({
                message: `Cannot withdraw an application that is already ${application.status}`,
            });
        }

        application.status = "withdrawn";
        await application.save();

        res.status(200).json({
            message: "Application withdrawn successfully",
            application,
        });
    } catch (error) {
        console.error("withdrawApplication error:", error.message);
        res.status(500).json({ message: "Failed to withdraw application" });
    }
};

/**
 * PATCH /api/applications/:applicationId/accept
 * Brand owner accepts a pending application, creating a Collaboration.
 */
const acceptApplication = async (req, res) => {
    try {
        const { applicationId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(applicationId)) {
            return res.status(400).json({ message: "Invalid application ID" });
        }

        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        const campaign = await Campaign.findById(application.campaignId);
        if (!campaign) {
            return res.status(404).json({ message: "Associated campaign not found" });
        }

        // Ownership check
        if (campaign.brandId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({
                message: "Access forbidden: you do not own this campaign",
            });
        }

        // Strict lifecycle check: only pending applications can be accepted
        if (application.status !== "pending") {
            return res.status(400).json({
                message: `Cannot accept an application that is already ${application.status}`,
            });
        }

        // Check if collaboration already exists (idempotent guard)
        let collaboration = await Collaboration.findOne({ applicationId: application._id });

        if (!collaboration) {
            let initialDeliverables = [];
            if (campaign.deliverables && Array.isArray(campaign.deliverables) && campaign.deliverables.length > 0) {
                initialDeliverables = campaign.deliverables
                    .filter((d) => typeof d === "string" && d.trim().length > 0)
                    .map((item) => ({
                        title: item.trim(),
                        description: "",
                        status: "pending",
                        dueDate: campaign.endDate || null,
                    }));
            }

            collaboration = await Collaboration.create({
                campaignId: campaign._id,
                applicationId: application._id,
                brandId: campaign.brandId,
                creatorId: application.creatorId,
                status: "active",
                deliverables: initialDeliverables,
            });
        }

        application.status = "accepted";
        await application.save();

        res.status(200).json({
            message: "Application accepted and collaboration created",
            application,
            collaboration,
        });
    } catch (error) {
        if (error.code === 11000) {
            // Duplicate collaboration already exists; update application status if needed
            try {
                const coll = await Collaboration.findOne({ applicationId: req.params.applicationId });
                const app = await Application.findById(req.params.applicationId);
                if (app && app.status !== "accepted") {
                    app.status = "accepted";
                    await app.save();
                }
                return res.status(200).json({
                    message: "Application accepted and collaboration created",
                    application: app,
                    collaboration: coll,
                });
            } catch (innerErr) {
                // fall through
            }
        }
        console.error("acceptApplication error:", error.message);
        res.status(500).json({ message: "Failed to accept application" });
    }
};

/**
 * PATCH /api/applications/:applicationId/reject
 * Brand owner rejects a pending application.
 */
const rejectApplication = async (req, res) => {
    try {
        const { applicationId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(applicationId)) {
            return res.status(400).json({ message: "Invalid application ID" });
        }

        const application = await Application.findById(applicationId);
        if (!application) {
            return res.status(404).json({ message: "Application not found" });
        }

        const campaign = await Campaign.findById(application.campaignId);
        if (!campaign) {
            return res.status(404).json({ message: "Associated campaign not found" });
        }

        // Ownership check
        if (campaign.brandId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({
                message: "Access forbidden: you do not own this campaign",
            });
        }

        // Strict lifecycle check
        if (application.status !== "pending") {
            return res.status(400).json({
                message: `Cannot reject an application that is already ${application.status}`,
            });
        }

        application.status = "rejected";
        await application.save();

        res.status(200).json({
            message: "Application rejected successfully",
            application,
        });
    } catch (error) {
        console.error("rejectApplication error:", error.message);
        res.status(500).json({ message: "Failed to reject application" });
    }
};

/**
 * GET /api/campaigns/:campaignId/my-application
 * Creator checks if they have already applied to a campaign.
 */
const checkMyApplication = async (req, res) => {
    try {
        const creatorId = req.user.userId;
        const { campaignId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(campaignId)) {
            return res.status(400).json({ message: "Invalid campaign ID" });
        }

        const application = await Application.findOne({ campaignId, creatorId });
        if (application) {
            return res.status(200).json({ hasApplied: true, application });
        }

        res.status(200).json({ hasApplied: false, application: null });
    } catch (error) {
        console.error("checkMyApplication error:", error.message);
        res.status(500).json({ message: "Failed to check application status" });
    }
};

module.exports = {
    applyToCampaign,
    getMyApplications,
    getCampaignApplications,
    getApplicationById,
    withdrawApplication,
    acceptApplication,
    rejectApplication,
    checkMyApplication,
};
