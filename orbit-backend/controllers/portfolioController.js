const mongoose = require("mongoose");
const PortfolioItem = require("../models/PortfolioItem");
const User = require("../models/User");
const CreatorProfile = require("../models/CreatorProfile");
const {
    isCloudinaryConfigured,
    uploadToCloudinary,
    deleteFromCloudinary,
} = require("../config/cloudinary");

/**
 * Helper to validate http/https URLs
 */
const isValidUrl = (urlStr) => {
    if (!urlStr || typeof urlStr !== "string") return false;
    try {
        const parsed = new URL(urlStr.trim());
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
};

/**
 * Helper to infer media type from URL extension or common hostnames
 */
const inferMediaType = (urlStr) => {
    if (!urlStr || typeof urlStr !== "string") return "link";
    const lower = urlStr.toLowerCase();
    if (
        lower.endsWith(".jpg") ||
        lower.endsWith(".jpeg") ||
        lower.endsWith(".png") ||
        lower.endsWith(".webp") ||
        lower.endsWith(".gif") ||
        lower.endsWith(".svg") ||
        lower.includes("unsplash.com") ||
        lower.includes("images.")
    ) {
        return "image";
    }
    if (
        lower.endsWith(".mp4") ||
        lower.endsWith(".webm") ||
        lower.endsWith(".mov") ||
        lower.includes("youtube.com") ||
        lower.includes("youtu.be") ||
        lower.includes("vimeo.com")
    ) {
        return "video";
    }
    return "link";
};

/**
 * POST /api/portfolio/upload
 * Authenticated creator uploads an image or video file to Cloudinary
 */
const uploadPortfolioMedia = async (req, res) => {
    try {
        const creatorId = req.user.userId || req.user._id;

        // Validate that a file was uploaded by multer
        if (!req.file) {
            return res.status(400).json({
                message: "No media file uploaded. Please attach a valid image or video.",
            });
        }

        const isImage = req.file.mimetype.startsWith("image/");
        const isVideo = req.file.mimetype.startsWith("video/");

        if (!isImage && !isVideo) {
            return res.status(400).json({
                message: "Unsupported media format. Allowed formats: JPEG, PNG, WebP for images; MP4, WebM for videos.",
            });
        }

        // Enforce strict size limits
        // Images: max 10MB (10 * 1024 * 1024 bytes)
        if (isImage && req.file.size > 10 * 1024 * 1024) {
            return res.status(400).json({
                message: "Image file size exceeds maximum limit of 10MB",
            });
        }

        // Videos: max 100MB (100 * 1024 * 1024 bytes)
        if (isVideo && req.file.size > 100 * 1024 * 1024) {
            return res.status(400).json({
                message: "Video file size exceeds maximum limit of 100MB",
            });
        }

        // Verify server-side Cloudinary configuration before upload
        if (!isCloudinaryConfigured()) {
            return res.status(503).json({
                message: "Cloudinary upload service is not configured on the server",
            });
        }

        const resourceType = isVideo ? "video" : "image";
        // Cloudinary folder is strictly derived from authenticated JWT creator ID
        const folder = `orbit/portfolio/${creatorId}`;

        const uploadResult = await uploadToCloudinary(req.file.buffer, {
            folder,
            resource_type: resourceType,
        });

        res.status(200).json({
            success: true,
            mediaUrl: uploadResult.secure_url,
            cloudinaryPublicId: uploadResult.public_id,
            mediaType: resourceType,
        });
    } catch (error) {
        console.error("uploadPortfolioMedia error:", error.message);
        res.status(500).json({
            message: "Failed to upload media to Cloudinary",
        });
    }
};

/**
 * GET /api/portfolio/mine
 * Authenticated creator retrieves their own portfolio items
 */
const getMyPortfolio = async (req, res) => {
    try {
        const creatorId = req.user.userId || req.user._id;
        const portfolioItems = await PortfolioItem.find({ creatorId })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            portfolioItems,
        });
    } catch (error) {
        console.error("getMyPortfolio error:", error.message);
        res.status(500).json({ message: "Failed to retrieve portfolio items" });
    }
};

/**
 * GET /api/creators/:creatorId/portfolio or /api/portfolio/creator/:creatorId
 * Public discovery of a creator's portfolio items by authenticated users
 */
const getCreatorPortfolio = async (req, res) => {
    try {
        const { creatorId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(creatorId)) {
            return res.status(400).json({ message: "Invalid creator ID" });
        }

        // Resolve creator: check if creatorId is User ID or CreatorProfile ID
        let targetUserId = null;
        const user = await User.findOne({ _id: creatorId, role: "creator" }).lean();
        if (user) {
            targetUserId = user._id;
        } else {
            const profile = await CreatorProfile.findById(creatorId).lean();
            if (profile) {
                targetUserId = profile.userId;
            }
        }

        if (!targetUserId) {
            return res.status(404).json({ message: "Creator not found" });
        }

        const portfolioItems = await PortfolioItem.find({ creatorId: targetUserId })
            .sort({ createdAt: -1 })
            .lean();

        res.status(200).json({
            success: true,
            portfolioItems,
        });
    } catch (error) {
        console.error("getCreatorPortfolio error:", error.message);
        res.status(500).json({ message: "Failed to retrieve creator portfolio" });
    }
};

/**
 * POST /api/portfolio
 * Authenticated creator creates a new portfolio item
 */
const createPortfolioItem = async (req, res) => {
    const {
        title,
        description,
        mediaUrl,
        mediaType,
        thumbnailUrl,
        projectUrl,
        cloudinaryPublicId,
    } = req.body;

    try {
        const creatorId = req.user.userId || req.user._id;

        // Title validation
        if (!title || typeof title !== "string" || !title.trim()) {
            return res.status(400).json({ message: "Title is required" });
        }
        if (title.trim().length > 120) {
            return res.status(400).json({ message: "Title cannot exceed 120 characters" });
        }

        // Description validation
        if (description && typeof description === "string" && description.trim().length > 1000) {
            return res.status(400).json({ message: "Description cannot exceed 1000 characters" });
        }

        // Media type validation
        const allowedMediaTypes = ["image", "video", "link"];
        let resolvedMediaType = mediaType;
        if (resolvedMediaType && !allowedMediaTypes.includes(resolvedMediaType)) {
            return res.status(400).json({
                message: `Invalid media type. Allowed types are: ${allowedMediaTypes.join(", ")}`,
            });
        }

        // URL validations if provided
        if (mediaUrl && mediaUrl.trim()) {
            if (!isValidUrl(mediaUrl)) {
                return res.status(400).json({ message: "Invalid media URL" });
            }
            if (!resolvedMediaType) {
                resolvedMediaType = inferMediaType(mediaUrl);
            }
        }

        if (thumbnailUrl && thumbnailUrl.trim()) {
            if (!isValidUrl(thumbnailUrl)) {
                return res.status(400).json({ message: "Invalid thumbnail URL" });
            }
        }

        if (projectUrl && projectUrl.trim()) {
            if (!isValidUrl(projectUrl)) {
                return res.status(400).json({ message: "Invalid project URL" });
            }
        }

        const portfolioItem = await PortfolioItem.create({
            creatorId,
            title: title.trim(),
            description: description ? description.trim() : "",
            mediaUrl: mediaUrl ? mediaUrl.trim() : "",
            mediaType: resolvedMediaType || "link",
            thumbnailUrl: thumbnailUrl ? thumbnailUrl.trim() : "",
            projectUrl: projectUrl ? projectUrl.trim() : "",
            cloudinaryPublicId: cloudinaryPublicId ? cloudinaryPublicId.trim() : "",
        });

        res.status(201).json({
            success: true,
            message: "Portfolio item created successfully",
            portfolioItem,
        });
    } catch (error) {
        console.error("createPortfolioItem error:", error.message);

        // Consistency check: Clean up newly uploaded Cloudinary asset if MongoDB save fails
        if (cloudinaryPublicId) {
            const resType = mediaType === "video" ? "video" : "image";
            await deleteFromCloudinary(cloudinaryPublicId, resType);
        }

        res.status(500).json({ message: "Failed to create portfolio item" });
    }
};

/**
 * PUT /api/portfolio/:portfolioItemId
 * Authenticated creator updates their own portfolio item
 */
const updatePortfolioItem = async (req, res) => {
    try {
        const { portfolioItemId } = req.params;
        const creatorId = req.user.userId || req.user._id;

        if (!mongoose.Types.ObjectId.isValid(portfolioItemId)) {
            return res.status(400).json({ message: "Invalid portfolio item ID" });
        }

        const item = await PortfolioItem.findById(portfolioItemId);
        if (!item) {
            return res.status(404).json({ message: "Portfolio item not found" });
        }

        // Ownership enforcement
        if (item.creatorId.toString() !== creatorId.toString()) {
            return res.status(403).json({
                message: "Access forbidden: you do not own this portfolio item",
            });
        }

        const {
            title,
            description,
            mediaUrl,
            mediaType,
            thumbnailUrl,
            projectUrl,
            cloudinaryPublicId,
        } = req.body;

        // Title validation
        if (title !== undefined) {
            if (!title || typeof title !== "string" || !title.trim()) {
                return res.status(400).json({ message: "Title cannot be empty" });
            }
            if (title.trim().length > 120) {
                return res.status(400).json({ message: "Title cannot exceed 120 characters" });
            }
            item.title = title.trim();
        }

        // Description validation
        if (description !== undefined) {
            if (description && typeof description === "string" && description.trim().length > 1000) {
                return res.status(400).json({ message: "Description cannot exceed 1000 characters" });
            }
            item.description = description ? description.trim() : "";
        }

        // Media type validation
        if (mediaType !== undefined) {
            const allowedMediaTypes = ["image", "video", "link"];
            if (!allowedMediaTypes.includes(mediaType)) {
                return res.status(400).json({
                    message: `Invalid media type. Allowed types are: ${allowedMediaTypes.join(", ")}`,
                });
            }
            item.mediaType = mediaType;
        }

        // URL validations if provided
        if (mediaUrl !== undefined) {
            if (mediaUrl && mediaUrl.trim()) {
                if (!isValidUrl(mediaUrl)) {
                    return res.status(400).json({ message: "Invalid media URL" });
                }
                item.mediaUrl = mediaUrl.trim();
            } else {
                item.mediaUrl = "";
            }
        }

        if (thumbnailUrl !== undefined) {
            if (thumbnailUrl && thumbnailUrl.trim()) {
                if (!isValidUrl(thumbnailUrl)) {
                    return res.status(400).json({ message: "Invalid thumbnail URL" });
                }
                item.thumbnailUrl = thumbnailUrl.trim();
            } else {
                item.thumbnailUrl = "";
            }
        }

        if (projectUrl !== undefined) {
            if (projectUrl && projectUrl.trim()) {
                if (!isValidUrl(projectUrl)) {
                    return res.status(400).json({ message: "Invalid project URL" });
                }
                item.projectUrl = projectUrl.trim();
            } else {
                item.projectUrl = "";
            }
        }

        // If replacement media was uploaded, delete old Cloudinary asset
        const oldPublicId = item.cloudinaryPublicId;
        if (
            cloudinaryPublicId !== undefined &&
            cloudinaryPublicId.trim() !== (oldPublicId || "")
        ) {
            if (oldPublicId) {
                const oldResourceType = item.mediaType === "video" ? "video" : "image";
                await deleteFromCloudinary(oldPublicId, oldResourceType);
            }
            item.cloudinaryPublicId = cloudinaryPublicId.trim();
        }

        await item.save();

        res.status(200).json({
            success: true,
            message: "Portfolio item updated successfully",
            portfolioItem: item,
        });
    } catch (error) {
        console.error("updatePortfolioItem error:", error.message);
        res.status(500).json({ message: "Failed to update portfolio item" });
    }
};

/**
 * DELETE /api/portfolio/:portfolioItemId
 * Authenticated creator deletes their own portfolio item, and cleans up Cloudinary media if present
 */
const deletePortfolioItem = async (req, res) => {
    try {
        const { portfolioItemId } = req.params;
        const creatorId = req.user.userId || req.user._id;

        if (!mongoose.Types.ObjectId.isValid(portfolioItemId)) {
            return res.status(400).json({ message: "Invalid portfolio item ID" });
        }

        const item = await PortfolioItem.findById(portfolioItemId);
        if (!item) {
            return res.status(404).json({ message: "Portfolio item not found" });
        }

        // Ownership enforcement
        if (item.creatorId.toString() !== creatorId.toString()) {
            return res.status(403).json({
                message: "Access forbidden: you do not own this portfolio item",
            });
        }

        // Clean up Cloudinary asset if item has a stored public ID
        if (item.cloudinaryPublicId) {
            const resourceType = item.mediaType === "video" ? "video" : "image";
            await deleteFromCloudinary(item.cloudinaryPublicId, resourceType);
        }

        await PortfolioItem.findByIdAndDelete(portfolioItemId);

        res.status(200).json({
            success: true,
            message: "Portfolio item deleted successfully",
        });
    } catch (error) {
        console.error("deletePortfolioItem error:", error.message);
        res.status(500).json({ message: "Failed to delete portfolio item" });
    }
};

module.exports = {
    getMyPortfolio,
    getCreatorPortfolio,
    createPortfolioItem,
    updatePortfolioItem,
    deletePortfolioItem,
    uploadPortfolioMedia,
};
