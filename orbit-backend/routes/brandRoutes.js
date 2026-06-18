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

router.post(
    "/onboarding",
    authMiddleware,
    createBrandProfile
);
router.put(
    "/save-step",
    authMiddleware,
    updateBrandProfile
);
router.get(
    "/profile",
    authMiddleware,
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