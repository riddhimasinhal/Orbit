const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { requireRole } = require("../middleware/roleMiddleware");
const {
    getMyPortfolio,
    getCreatorPortfolio,
    createPortfolioItem,
    updatePortfolioItem,
    deletePortfolioItem,
} = require("../controllers/portfolioController");

// Creator: List own portfolio items
router.get("/mine", authMiddleware, requireRole("creator"), getMyPortfolio);

// Authenticated users (brands/creators): View specific creator's portfolio
router.get("/creator/:creatorId", authMiddleware, getCreatorPortfolio);

// Creator: Create portfolio item
router.post("/", authMiddleware, requireRole("creator"), createPortfolioItem);

// Creator: Update own portfolio item
router.put("/:portfolioItemId", authMiddleware, requireRole("creator"), updatePortfolioItem);

// Creator: Delete own portfolio item
router.delete("/:portfolioItemId", authMiddleware, requireRole("creator"), deletePortfolioItem);

module.exports = router;
