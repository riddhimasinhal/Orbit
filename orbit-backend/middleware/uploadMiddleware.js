const multer = require("multer");

// In-memory storage: files are held in memory buffers and streamed to Cloudinary
const storage = multer.memoryStorage();

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "video/mp4",
    "video/webm",
];

const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        const error = new Error(
            "Unsupported file type. Allowed formats: JPEG, PNG, WebP for images; MP4, WebM for videos."
        );
        error.code = "INVALID_FILE_TYPE";
        cb(error, false);
    }
};

// Max limit 100MB (video limit; image 10MB limit is enforced during validation)
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100 MB
    },
});

// Middleware wrapper that captures Multer errors cleanly and returns appropriate HTTP responses
const handleMediaUpload = (req, res, next) => {
    const singleUpload = upload.single("media");

    singleUpload(req, res, (err) => {
        if (err) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({
                    message: "File is too large. Maximum size is 10MB for images and 100MB for videos.",
                });
            }
            if (err.code === "INVALID_FILE_TYPE") {
                return res.status(400).json({
                    message: err.message,
                });
            }
            return res.status(400).json({
                message: err.message || "Failed to process uploaded file",
            });
        }
        next();
    });
};

module.exports = {
    handleMediaUpload,
    ALLOWED_MIME_TYPES,
};
