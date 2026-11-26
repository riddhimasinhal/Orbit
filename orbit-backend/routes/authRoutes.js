const express = require("express");
const router = express.Router();
const { signup, login } = require("../controllers/authController");
const { loginLimiter, signupLimiter } = require("../middleware/rateLimiter");

router.post("/signup", signupLimiter, signup);
router.post("/login", loginLimiter, login);

module.exports = router;
