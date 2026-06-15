const express = require("express");
const router = express.Router();

const {
    createBrandProfile,
} = require("../controllers/brandController");

const authMiddleware = require("../middleware/authMiddleware");

router.post(
    "/onboarding",
    authMiddleware,
    createBrandProfile
);

module.exports = router;