const rateLimit = require("express-rate-limit");

// Check if running in test environment
const isTest = process.env.NODE_ENV === "test";

// Generic rate limit response handler that returns clean JSON without exposing internals
const standardRateLimitHandler = (req, res, next, options) => {
    return res.status(options.statusCode || 429).json({
        message: options.message || "Too many requests. Please slow down and try again later.",
    });
};

/**
 * General API Limiter: 300 requests per 15 minutes per IP
 */
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests to the API. Please try again later.",
    handler: standardRateLimitHandler,
    skip: () => isTest,
});

/**
 * Strict Login Limiter: 10 login attempts per 15 minutes per IP
 */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many login attempts from this IP. Please try again after 15 minutes.",
    handler: standardRateLimitHandler,
    skip: () => isTest,
});

/**
 * Signup Limiter: 15 signup attempts per hour per IP
 */
const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 15,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many accounts created from this IP. Please try again later.",
    handler: standardRateLimitHandler,
    skip: () => isTest,
});

/**
 * Payment Verification / Order Limiter: 30 requests per 15 minutes per IP
 */
const paymentLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: "Payment request limit exceeded. Please wait a few moments before trying again.",
    handler: standardRateLimitHandler,
    skip: () => isTest,
});

module.exports = {
    generalLimiter,
    loginLimiter,
    signupLimiter,
    paymentLimiter,
};
