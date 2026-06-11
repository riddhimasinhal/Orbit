const express = require("express");

const router = express.Router();
const { createCreatorProfile,
} = require("../controllers/creatorController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/onboarding",
    authMiddleware,
    createCreatorProfile
)
console.log("Creator Routes Loaded");
module.exports = router;