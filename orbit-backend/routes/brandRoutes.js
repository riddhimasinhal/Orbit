const express = require("express");
const router = express.Router();

const {
    createBrandProfile,
    updateBrandProfile,
    getBrandProfile,
    getAllBrands,
    getBrandById,
} = require("../controllers/brandController");

const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");

router.post(
    "/onboarding",
    authMiddleware,
    requireRole("brand"),
    createBrandProfile
);
router.put(
    "/save-step",
    authMiddleware,
    requireRole("brand"),
    updateBrandProfile
);
router.get(
    "/profile",
    authMiddleware,
    requireRole("brand"),
    getBrandProfile
)

router.get(
    "/all",
    authMiddleware,
    getAllBrands,
)

router.get(
    "/:id",
    authMiddleware,
    getBrandById,
)

module.exports = router;