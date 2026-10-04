const cloudinary = require("cloudinary").v2;
const { Readable } = require("stream");

// Configure Cloudinary from environment variables
cloudinary.config({
    cloud_name: (process.env.CLOUDINARY_CLOUD_NAME || "").trim().toLowerCase(),
    api_key: (process.env.CLOUDINARY_API_KEY || "").trim(),
    api_secret: (process.env.CLOUDINARY_API_SECRET || "").trim(),
    secure: true,
});

/**
 * Check if all required Cloudinary environment variables are present
 */
const isCloudinaryConfigured = () => {
    return Boolean(
        process.env.CLOUDINARY_CLOUD_NAME &&
        process.env.CLOUDINARY_API_KEY &&
        process.env.CLOUDINARY_API_SECRET
    );
};

/**
 * Upload a memory buffer to Cloudinary using upload_stream
 * @param {Buffer} buffer - File buffer from multer memory storage
 * @param {Object} options - Cloudinary upload options (folder, resource_type, etc.)
 * @returns {Promise<Object>} Cloudinary upload result
 */
const uploadToCloudinary = (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
        if (!isCloudinaryConfigured()) {
            return reject(new Error("Cloudinary configuration missing. Upload cannot proceed."));
        }

        const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
            if (error) {
                return reject(error);
            }
            resolve(result);
        });

        Readable.from(buffer).pipe(stream);
    });
};

/**
 * Delete a media asset from Cloudinary by its public ID
 * @param {string} publicId - The Cloudinary public ID stored on the portfolio item
 * @param {string} resourceType - "image" or "video"
 * @returns {Promise<Object|null>}
 */
const deleteFromCloudinary = async (publicId, resourceType = "image") => {
    if (!isCloudinaryConfigured() || !publicId) {
        return null;
    }
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
        return result;
    } catch (err) {
        console.error("Cloudinary cleanup error for publicId:", publicId, err.message);
        return null;
    }
};

module.exports = {
    cloudinary,
    isCloudinaryConfigured,
    uploadToCloudinary,
    deleteFromCloudinary,
};
