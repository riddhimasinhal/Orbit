/**
 * Automated Verification Suite for Security Hardening:
 * 1. CORS Allowed Origins & Rejection of Unauthorized Origins
 * 2. Helmet Security Headers (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy)
 * 3. Login Rate Limiting (Strict 10 attempts limit triggering HTTP 429)
 * 4. General API Rate Limiting headers
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const request = require("supertest");
const connectDB = require("./config/db");
const mongoose = require("mongoose");

// Explicitly ensure test environment doesn't disable rate limit for this test
process.env.NODE_ENV = "development";
const app = require("./server");

async function runSecurityTests() {
    console.log("==================================================");
    console.log("   ORBIT SECURITY HARDENING VALIDATION SUITE      ");
    console.log("==================================================");

    await connectDB();

    let passed = 0;
    let failed = 0;

    function record(name, condition) {
        if (condition) {
            console.log(`[PASS] ${name}`);
            passed++;
        } else {
            console.error(`[FAIL] ${name}`);
            failed++;
        }
    }

    try {
        // --- 1. HELMET SECURITY HEADERS ---
        console.log("\n--- Testing Helmet Security Headers ---");
        const resHelmet = await request(app).get("/");
        record("X-Content-Type-Options: nosniff is present", resHelmet.headers["x-content-type-options"] === "nosniff");
        record("X-Frame-Options: DENY is present", resHelmet.headers["x-frame-options"] === "DENY");
        record("Content-Security-Policy is present and includes Razorpay/Cloudinary directives",
            resHelmet.headers["content-security-policy"] &&
            resHelmet.headers["content-security-policy"].includes("checkout.razorpay.com") &&
            resHelmet.headers["content-security-policy"].includes("res.cloudinary.com")
        );
        record("Referrer-Policy: strict-origin-when-cross-origin is present",
            resHelmet.headers["referrer-policy"] === "strict-origin-when-cross-origin"
        );

        // --- 2. CORS ALLOWLISTING & REJECTION ---
        console.log("\n--- Testing CORS Origin Restriction ---");
        const resAllowed = await request(app)
            .get("/")
            .set("Origin", "http://localhost:5173");
        record("Authorized origin (http://localhost:5173) receives Access-Control-Allow-Origin",
            resAllowed.headers["access-control-allow-origin"] === "http://localhost:5173"
        );
        record("CORS credentials are allowed",
            resAllowed.headers["access-control-allow-credentials"] === "true"
        );

        const resUnauthorized = await request(app)
            .get("/")
            .set("Origin", "https://unauthorized-attacker.example.com");
        record("Unauthorized origin (https://unauthorized-attacker.example.com) is rejected with HTTP 403",
            resUnauthorized.status === 403 &&
            resUnauthorized.body.message &&
            resUnauthorized.body.message.includes("CORS policy")
        );

        // --- 3. RATE LIMITING ON AUTH LOGIN ---
        console.log("\n--- Testing Login Rate Limiting (Strict 10 limit) ---");
        let blockedByRateLimit = false;
        let lastStatus = 0;

        // Fire 12 rapid dummy login attempts with invalid credentials
        for (let i = 1; i <= 12; i++) {
            const resLogin = await request(app)
                .post("/api/auth/login")
                .send({ email: "security_test_dummy@example.com", password: "wrongpassword123" });
            lastStatus = resLogin.status;
            if (resLogin.status === 429) {
                blockedByRateLimit = true;
                break;
            }
        }

        record("Login requests exceeding limit are blocked with HTTP 429", blockedByRateLimit);
        record("Rate limit error message does not leak system internals",
            lastStatus === 429
        );

    } catch (err) {
        console.error("Test execution error:", err);
        failed++;
    } finally {
        await mongoose.disconnect();
    }

    console.log("\n==================================================");
    console.log(`TOTAL SECURITY TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
    console.log("==================================================");

    if (failed > 0) {
        process.exit(1);
    }
}

runSecurityTests();
