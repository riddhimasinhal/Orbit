const mongoose = require("mongoose");
const Campaign = require("../models/Campaign");
const BrandProfile = require("../models/BrandProfile");
const User = require("../models/User");

/**
 * Helper to validate date formats and ordering
 */
const validateDates = (startDate, endDate, applicationDeadline) => {
    if (startDate && isNaN(new Date(startDate).getTime())) {
        return "Invalid start date format";
    }
    if (endDate && isNaN(new Date(endDate).getTime())) {
        return "Invalid end date format";
    }
    if (applicationDeadline && isNaN(new Date(applicationDeadline).getTime())) {
        return "Invalid application deadline date format";
    }
    if (startDate && endDate) {
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();
        if (end < start) {
            return "End date cannot be earlier than start date";
        }
    }
    return null;
};

/**
 * POST /api/campaigns
 * Brand creates a new campaign (saved as draft by default).
 */
const createCampaign = async (req, res) => {
    try {
        const brandId = req.user.userId;
        const {
            title,
            description,
            niche,
            budgetMin,
            budgetMax,
            deliverables,
            applicationDeadline,
            startDate,
            endDate,
        } = req.body;

        // Required text fields
        if (!title || typeof title !== "string" || !title.trim()) {
            return res.status(400).json({ message: "Campaign title is required" });
        }
        if (!description || typeof description !== "string" || !description.trim()) {
            return res.status(400).json({ message: "Campaign description is required" });
        }

        // Budget validation
        const minBudget = Number(budgetMin) || 0;
        const maxBudget = Number(budgetMax) || 0;

        if (minBudget < 0 || maxBudget < 0) {
            return res.status(400).json({ message: "Budget values cannot be negative" });
        }
        if (maxBudget > 0 && minBudget > maxBudget) {
            return res.status(400).json({ message: "Minimum budget cannot exceed maximum budget" });
        }

        // Date validation
        const dateError = validateDates(startDate, endDate, applicationDeadline);
        if (dateError) {
            return res.status(400).json({ message: dateError });
        }

        // Clean deliverables & niche
        const cleanDeliverables = Array.isArray(deliverables)
            ? deliverables.map((d) => String(d).trim()).filter(Boolean)
            : typeof deliverables === "string" && deliverables.trim()
            ? [deliverables.trim()]
            : [];

        const cleanNiche = Array.isArray(niche)
            ? niche.map((n) => String(n).trim()).filter(Boolean)
            : typeof niche === "string" && niche.trim()
            ? [niche.trim()]
            : [];

        const campaign = await Campaign.create({
            brandId,
            title: title.trim(),
            description: description.trim(),
            niche: cleanNiche,
            budgetMin: minBudget,
            budgetMax: maxBudget,
            deliverables: cleanDeliverables,
            applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : null,
            startDate: startDate ? new Date(startDate) : null,
            endDate: endDate ? new Date(endDate) : null,
            status: "draft",
        });

        res.status(201).json({
            message: "Campaign created successfully",
            campaign,
        });
    } catch (error) {
        if (error.name === "ValidationError") {
            return res.status(400).json({ message: error.message });
        }
        console.error("createCampaign error:", error.message);
        res.status(500).json({ message: "Failed to create campaign" });
    }
};

/**
 * GET /api/campaigns/mine
 * Brand views their own campaigns (draft, published, closed).
 */
const getMyCampaigns = async (req, res) => {
    try {
        const brandId = req.user.userId;
        const { status } = req.query;

        const filter = { brandId };
        if (status && ["draft", "published", "closed"].includes(status)) {
            filter.status = status;
        }

        let page = parseInt(req.query.page, 10);
        let limit = parseInt(req.query.limit, 10);

        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = 10;
        if (limit > 50) limit = 50;

        const skip = (page - 1) * limit;

        const [total, campaigns] = await Promise.all([
            Campaign.countDocuments(filter),
            Campaign.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
        ]);

        res.status(200).json({
            campaigns,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
            },
        });
    } catch (error) {
        console.error("getMyCampaigns error:", error.message);
        res.status(500).json({ message: "Failed to fetch brand campaigns" });
    }
};

/**
 * GET /api/campaigns/:campaignId
 * Detail view for a campaign:
 * - Brand owner can view any status (draft, published, closed)
 * - Creators (and other users) can ONLY view published campaigns
 */
const getCampaignById = async (req, res) => {
    try {
        const { campaignId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(campaignId)) {
            return res.status(400).json({ message: "Invalid campaign ID" });
        }

        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        const isOwner = campaign.brandId.toString() === req.user.userId.toString();

        // Non-owners can only see published campaigns
        if (!isOwner && campaign.status !== "published") {
            return res.status(404).json({ message: "Campaign not found or not published" });
        }

        // Fetch brand profile details
        const [brandProfile, brandUser] = await Promise.all([
            BrandProfile.findOne({ userId: campaign.brandId }),
            User.findById(campaign.brandId).select("name email"),
        ]);

        const brandInfo = {
            userId: campaign.brandId,
            companyName: brandProfile?.companyName || brandUser?.name || "Brand",
            industry: brandProfile?.industry || "",
            location: brandProfile?.location || "",
            companySize: brandProfile?.companySize || "",
            website: brandProfile?.website || "",
            description: brandProfile?.description || "",
        };

        res.status(200).json({
            campaign: {
                ...campaign.toObject(),
                brand: brandInfo,
            },
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({ message: "Invalid campaign ID" });
        }
        console.error("getCampaignById error:", error.message);
        res.status(500).json({ message: "Failed to retrieve campaign details" });
    }
};

/**
 * PUT /api/campaigns/:campaignId
 * Brand owner edits their campaign. Closed campaigns cannot be modified.
 */
const updateCampaign = async (req, res) => {
    try {
        const { campaignId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(campaignId)) {
            return res.status(400).json({ message: "Invalid campaign ID" });
        }

        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Ownership check
        if (campaign.brandId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({ message: "Access forbidden: you do not own this campaign" });
        }

        // Status check
        if (campaign.status === "closed") {
            return res.status(400).json({ message: "Closed campaigns cannot be modified" });
        }

        const {
            title,
            description,
            niche,
            budgetMin,
            budgetMax,
            deliverables,
            applicationDeadline,
            startDate,
            endDate,
        } = req.body;

        if (title !== undefined) {
            if (typeof title !== "string" || !title.trim()) {
                return res.status(400).json({ message: "Campaign title cannot be empty" });
            }
            campaign.title = title.trim();
        }

        if (description !== undefined) {
            if (typeof description !== "string" || !description.trim()) {
                return res.status(400).json({ message: "Campaign description cannot be empty" });
            }
            campaign.description = description.trim();
        }

        const effectiveMin = budgetMin !== undefined ? Number(budgetMin) : campaign.budgetMin;
        const effectiveMax = budgetMax !== undefined ? Number(budgetMax) : campaign.budgetMax;

        if (effectiveMin < 0 || effectiveMax < 0) {
            return res.status(400).json({ message: "Budget values cannot be negative" });
        }
        if (effectiveMax > 0 && effectiveMin > effectiveMax) {
            return res.status(400).json({ message: "Minimum budget cannot exceed maximum budget" });
        }

        if (budgetMin !== undefined) campaign.budgetMin = effectiveMin;
        if (budgetMax !== undefined) campaign.budgetMax = effectiveMax;

        const effectiveStart = startDate !== undefined ? startDate : campaign.startDate;
        const effectiveEnd = endDate !== undefined ? endDate : campaign.endDate;
        const effectiveDeadline =
            applicationDeadline !== undefined ? applicationDeadline : campaign.applicationDeadline;

        const dateError = validateDates(effectiveStart, effectiveEnd, effectiveDeadline);
        if (dateError) {
            return res.status(400).json({ message: dateError });
        }

        if (startDate !== undefined) {
            campaign.startDate = startDate ? new Date(startDate) : null;
        }
        if (endDate !== undefined) {
            campaign.endDate = endDate ? new Date(endDate) : null;
        }
        if (applicationDeadline !== undefined) {
            campaign.applicationDeadline = applicationDeadline ? new Date(applicationDeadline) : null;
        }

        if (deliverables !== undefined) {
            campaign.deliverables = Array.isArray(deliverables)
                ? deliverables.map((d) => String(d).trim()).filter(Boolean)
                : typeof deliverables === "string" && deliverables.trim()
                ? [deliverables.trim()]
                : [];
        }

        if (niche !== undefined) {
            campaign.niche = Array.isArray(niche)
                ? niche.map((n) => String(n).trim()).filter(Boolean)
                : typeof niche === "string" && niche.trim()
                ? [niche.trim()]
                : [];
        }

        await campaign.save();

        res.status(200).json({
            message: "Campaign updated successfully",
            campaign,
        });
    } catch (error) {
        if (error.name === "CastError") {
            return res.status(400).json({ message: "Invalid resource identifier" });
        }
        console.error("updateCampaign error:", error.message);
        res.status(500).json({ message: "Failed to update campaign" });
    }
};

/**
 * PATCH /api/campaigns/:campaignId/publish
 * Brand owner publishes their draft campaign.
 */
const publishCampaign = async (req, res) => {
    try {
        const { campaignId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(campaignId)) {
            return res.status(400).json({ message: "Invalid campaign ID" });
        }

        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Ownership check
        if (campaign.brandId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({ message: "Access forbidden: you do not own this campaign" });
        }

        if (campaign.status === "closed") {
            return res.status(400).json({ message: "Closed campaigns cannot be published" });
        }

        // Validation for publishing
        if (!campaign.title || !campaign.title.trim()) {
            return res.status(400).json({ message: "A title is required before publishing" });
        }
        if (!campaign.description || !campaign.description.trim()) {
            return res.status(400).json({ message: "A description is required before publishing" });
        }
        if (campaign.budgetMax <= 0) {
            return res.status(400).json({ message: "A maximum budget greater than zero is required to publish" });
        }
        if (!campaign.deliverables || campaign.deliverables.length === 0) {
            return res.status(400).json({ message: "At least one deliverable is required before publishing" });
        }
        if (!campaign.applicationDeadline) {
            return res.status(400).json({ message: "An application deadline is required before publishing" });
        }

        campaign.status = "published";
        await campaign.save();

        res.status(200).json({
            message: "Campaign published successfully",
            campaign,
        });
    } catch (error) {
        console.error("publishCampaign error:", error.message);
        res.status(500).json({ message: "Failed to publish campaign" });
    }
};

/**
 * PATCH /api/campaigns/:campaignId/close
 * Brand owner closes their campaign.
 */
const closeCampaign = async (req, res) => {
    try {
        const { campaignId } = req.params;
        if (!mongoose.Types.ObjectId.isValid(campaignId)) {
            return res.status(400).json({ message: "Invalid campaign ID" });
        }

        const campaign = await Campaign.findById(campaignId);
        if (!campaign) {
            return res.status(404).json({ message: "Campaign not found" });
        }

        // Ownership check
        if (campaign.brandId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({ message: "Access forbidden: you do not own this campaign" });
        }

        campaign.status = "closed";
        await campaign.save();

        res.status(200).json({
            message: "Campaign closed successfully",
            campaign,
        });
    } catch (error) {
        console.error("closeCampaign error:", error.message);
        res.status(500).json({ message: "Failed to close campaign" });
    }
};

/**
 * GET /api/campaigns
 * Public marketplace endpoint for published campaigns.
 * Supports pagination, search, niche filtering, and batched brand population (zero N+1).
 */
const getAllPublishedCampaigns = async (req, res) => {
    try {
        const { search, niche } = req.query;

        const filter = { status: "published" };

        if (niche) {
            filter.niche = niche;
        }

        if (search && search.trim()) {
            filter.$or = [
                { title: { $regex: search.trim(), $options: "i" } },
                { description: { $regex: search.trim(), $options: "i" } },
            ];
        }

        let page = parseInt(req.query.page, 10);
        let limit = parseInt(req.query.limit, 10);

        if (isNaN(page) || page < 1) page = 1;
        if (isNaN(limit) || limit < 1) limit = 12;
        if (limit > 50) limit = 50;

        const skip = (page - 1) * limit;

        const [total, campaigns] = await Promise.all([
            Campaign.countDocuments(filter),
            Campaign.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        ]);

        // Batch populate brand profile info without N+1
        const brandIds = [...new Set(campaigns.map((c) => c.brandId.toString()))];
        const [brandProfiles, brandUsers] = await Promise.all([
            brandIds.length > 0 ? BrandProfile.find({ userId: { $in: brandIds } }).lean() : [],
            brandIds.length > 0 ? User.find({ _id: { $in: brandIds } }).select("name email").lean() : [],
        ]);

        const profileMap = new Map(brandProfiles.map((p) => [p.userId.toString(), p]));
        const userMap = new Map(brandUsers.map((u) => [u._id.toString(), u]));

        const populatedCampaigns = campaigns.map((c) => {
            const bProfile = profileMap.get(c.brandId.toString());
            const bUser = userMap.get(c.brandId.toString());
            return {
                ...c,
                brand: {
                    userId: c.brandId,
                    companyName: bProfile?.companyName || bUser?.name || "Brand",
                    industry: bProfile?.industry || "",
                    location: bProfile?.location || "",
                },
            };
        });

        res.status(200).json({
            campaigns: populatedCampaigns,
            data: populatedCampaigns,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit) || 1,
            },
        });
    } catch (error) {
        console.error("getAllPublishedCampaigns error:", error.message);
        res.status(500).json({ message: "Failed to retrieve published campaigns" });
    }
};

module.exports = {
    createCampaign,
    getMyCampaigns,
    getCampaignById,
    updateCampaign,
    publishCampaign,
    closeCampaign,
    getAllPublishedCampaigns,
};
