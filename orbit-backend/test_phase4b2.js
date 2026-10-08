const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const express = require("express");
const { spawn } = require("child_process");
const path = require("path");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

dotenv.config();

const User = require("./models/User");
const CreatorProfile = require("./models/CreatorProfile");
const BrandProfile = require("./models/BrandProfile");
const authRoutes = require("./routes/authRoutes");
const adminRoutes = require("./routes/adminRoutes");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

function createTestApp() {
    const app = express();
    app.use(express.json());
    app.use("/api/auth", authRoutes);
    app.use("/api/admin", adminRoutes);
    return app;
}

/**
 * Helper to run create-admin CLI as a child process with piped stdin
 */
function runCreateAdminCLI(inputs) {
    return new Promise((resolve) => {
        const scriptPath = path.join(__dirname, "scripts/createAdmin.js");
        const proc = spawn("node", [scriptPath], {
            cwd: __dirname,
            stdio: ["pipe", "pipe", "pipe"],
            env: { ...process.env },
        });

        let stdout = "";
        let stderr = "";

        proc.stdout.on("data", (chunk) => {
            stdout += chunk.toString();
        });

        proc.stderr.on("data", (chunk) => {
            stderr += chunk.toString();
        });

        // Write inputs separated by newlines
        proc.stdin.write(inputs.join("\n") + "\n");
        proc.stdin.end();

        proc.on("close", (code) => {
            resolve({ code, stdout, stderr });
        });
    });
}

async function runPhase4B2Tests() {
    console.log("==========================================");
    console.log("   ORBIT PHASE 4B.2 VALIDATION SUITE      ");
    console.log("   (Secure Initial Admin Provisioning)    ");
    console.log("==========================================\n");

    let connectedTo = "";
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: "Orbit", serverSelectionTimeoutMS: 5000 });
        connectedTo = "MongoDB Atlas Live Cluster";
    } catch {
        await mongoose.connect("mongodb://127.0.0.1:27017/Orbit_Phase4B2_Test", { serverSelectionTimeoutMS: 5000 });
        connectedTo = "Local MongoDB (127.0.0.1:27017/Orbit_Phase4B2_Test)";
    }
    console.log(`Connected to: ${connectedTo}\n`);

    const app = createTestApp();
    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    async function apiRequest(method, endpoint, body = null, token = null) {
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = token;
        const opts = { method, headers };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(`${baseUrl}${endpoint}`, opts);
        let resBody = null;
        try {
            resBody = await res.json();
        } catch {}
        return { status: res.status, body: resBody };
    }

    const results = [];
    function record(name, status, notes = "") {
        results.push({ name, status, notes });
        console.log(`[${status}] ${name}${notes ? " - " + notes : ""}`);
    }

    const testUserIds = [];

    try {
        const timestamp = Date.now();
        const testAdminEmail = `phase4b2_admin_${timestamp}@example.com`;
        const testCreatorEmail = `phase4b2_creator_${timestamp}@example.com`;
        const testBrandEmail = `phase4b2_brand_${timestamp}@example.com`;
        const rawPassword = "SecurePassword123!";

        // Cleanup any previous matching disposable test data
        const cleanupFilter = { email: { $regex: /^phase4b2_/i } };
        const prevUsers = await User.find(cleanupFilter);
        if (prevUsers.length) {
            const prevIds = prevUsers.map((u) => u._id);
            await Promise.all([
                User.deleteMany({ _id: { $in: prevIds } }),
                CreatorProfile.deleteMany({ userId: { $in: prevIds } }),
                BrandProfile.deleteMany({ userId: { $in: prevIds } }),
            ]);
        }

        console.log("--- 1. CLI ADMIN CREATION & PASSWORD HASHING ---");

        // Scenario 1: Admin can be created via CLI
        const cliRun1 = await runCreateAdminCLI([
            "Phase4B2 Super Admin",
            `  ${testAdminEmail.toUpperCase()}  `, // Test email trimming & case normalization
            rawPassword,
            rawPassword,
        ]);
        const createdAdminDoc = await User.findOne({ email: testAdminEmail });
        if (cliRun1.code === 0 && createdAdminDoc) {
            testUserIds.push(createdAdminDoc._id);
            record("1. Admin can be created via CLI", "PASS", `Created user with id: ${createdAdminDoc._id}`);
        } else {
            record("1. Admin can be created via CLI", "FAIL", `CLI exited with code ${cliRun1.code}. Output: ${cliRun1.stdout} ${cliRun1.stderr}`);
        }

        // Scenario 2: Created user's role is admin
        if (createdAdminDoc && createdAdminDoc.role === "admin" && createdAdminDoc.onBoardingCompleted === true) {
            record("2. Created user's role is admin", "PASS", `role: ${createdAdminDoc.role}, onBoardingCompleted: ${createdAdminDoc.onBoardingCompleted}`);
        } else {
            record("2. Created user's role is admin", "FAIL", `Role was: ${createdAdminDoc?.role}`);
        }

        // Scenario 3: Password is hashed
        const isPasswordHashed = createdAdminDoc && createdAdminDoc.password && (await bcrypt.compare(rawPassword, createdAdminDoc.password));
        if (isPasswordHashed) {
            record("3. Password is hashed", "PASS", "bcrypt.compare verified true");
        } else {
            record("3. Password is hashed", "FAIL", "Password hash mismatch");
        }

        // Scenario 4: Plaintext password is not stored
        const notPlaintext = createdAdminDoc && createdAdminDoc.password !== rawPassword && !createdAdminDoc.password.includes(rawPassword);
        if (notPlaintext) {
            record("4. Plaintext password is not stored", "PASS", "Password field contains bcrypt hash");
        } else {
            record("4. Plaintext password is not stored", "FAIL", "Plaintext detected");
        }

        console.log("\n--- 2. DUPLICATE PROTECTION & ROLE IMMUTABILITY ---");

        // Scenario 5: Duplicate admin email is rejected safely
        const cliRunDuplicateAdmin = await runCreateAdminCLI([
            "Duplicate Admin",
            testAdminEmail,
            rawPassword,
            rawPassword,
        ]);
        const adminCount = await User.countDocuments({ email: testAdminEmail });
        const duplicateAdminRejected = cliRunDuplicateAdmin.stdout.includes("An admin with this email already exists") && adminCount === 1;
        if (duplicateAdminRejected) {
            record("5. Duplicate admin email is rejected safely", "PASS", "CLI printed duplicate warning, user count = 1");
        } else {
            record("5. Duplicate admin email is rejected safely", "FAIL", `Output: ${cliRunDuplicateAdmin.stdout}`);
        }

        // Create existing creator user
        const creatorPasswordHash = await bcrypt.hash("CreatorPass123!", 10);
        const creatorUser = await User.create({
            name: "Existing Creator",
            email: testCreatorEmail,
            password: creatorPasswordHash,
            role: "creator",
            onBoardingCompleted: true,
        });
        testUserIds.push(creatorUser._id);

        // Scenario 6: Existing creator email is not promoted
        const cliRunCreator = await runCreateAdminCLI([
            "Attempted Admin Promote",
            testCreatorEmail,
            "NewPassword123!",
            "NewPassword123!",
        ]);
        const creatorCheck = await User.findOne({ email: testCreatorEmail });
        const creatorUnchanged =
            cliRunCreator.stdout.includes("A user with this email already exists with another role") &&
            creatorCheck.role === "creator" &&
            (await bcrypt.compare("CreatorPass123!", creatorCheck.password));
        if (creatorUnchanged) {
            record("6. Existing creator email is not promoted", "PASS", "Creator role and password preserved");
        } else {
            record("6. Existing creator email is not promoted", "FAIL", `Role: ${creatorCheck?.role}`);
        }

        // Create existing brand user
        const brandPasswordHash = await bcrypt.hash("BrandPass123!", 10);
        const brandUser = await User.create({
            name: "Existing Brand",
            email: testBrandEmail,
            password: brandPasswordHash,
            role: "brand",
            onBoardingCompleted: true,
        });
        testUserIds.push(brandUser._id);

        // Scenario 7: Existing brand email is not promoted
        const cliRunBrand = await runCreateAdminCLI([
            "Attempted Brand Promote",
            testBrandEmail,
            "NewPassword123!",
            "NewPassword123!",
        ]);
        const brandCheck = await User.findOne({ email: testBrandEmail });
        const brandUnchanged =
            cliRunBrand.stdout.includes("A user with this email already exists with another role") &&
            brandCheck.role === "brand" &&
            (await bcrypt.compare("BrandPass123!", brandCheck.password));
        if (brandUnchanged) {
            record("7. Existing brand email is not promoted", "PASS", "Brand role and password preserved");
        } else {
            record("7. Existing brand email is not promoted", "FAIL", `Role: ${brandCheck?.role}`);
        }

        console.log("\n--- 3. PUBLIC SIGNUP & AUTHENTICATION INTEGRATION ---");

        // Scenario 8: Public signup cannot create admin
        const signupAttempt = await apiRequest("POST", "/api/auth/signup", {
            name: "Malicious Admin",
            email: `malicious_admin_${timestamp}@example.com`,
            password: "HackerPassword123!",
            confirmPass: "HackerPassword123!",
            role: "admin",
        });
        const maliciousDoc = await User.findOne({ email: `malicious_admin_${timestamp}@example.com` });
        if (signupAttempt.status === 400 && !maliciousDoc) {
            record("8. Public signup cannot create admin", "PASS", "HTTP 400 returned, no admin created");
        } else {
            record("8. Public signup cannot create admin", "FAIL", `Status: ${signupAttempt.status}`);
        }

        // Scenario 9: Created admin can authenticate through normal login
        const loginRes = await apiRequest("POST", "/api/auth/login", {
            email: testAdminEmail,
            password: rawPassword,
        });
        if (loginRes.status === 200 && loginRes.body?.token) {
            record("9. Created admin can authenticate through normal login", "PASS", "HTTP 200 with JWT token");
        } else {
            record("9. Created admin can authenticate through normal login", "FAIL", `Status: ${loginRes.status}`);
        }

        // Scenario 10: Admin authentication receives the correct role
        const adminToken = loginRes.body?.token;
        const decodedToken = adminToken ? jwt.decode(adminToken) : null;
        if (loginRes.body?.role === "admin" && decodedToken?.role === "admin") {
            record("10. Admin authentication receives the correct role", "PASS", `Token role: ${decodedToken?.role}`);
        } else {
            record("10. Admin authentication receives the correct role", "FAIL", `Role: ${loginRes.body?.role}`);
        }

        // Scenario 11: Admin can access /admin/verifications
        const adminAccessRes = await apiRequest("GET", "/api/admin/verifications", null, adminToken);
        if (adminAccessRes.status === 200) {
            record("11. Admin can access /admin/verifications", "PASS", "HTTP 200 returned from admin portal endpoint");
        } else {
            record("11. Admin can access /admin/verifications", "FAIL", `Status: ${adminAccessRes.status}`);
        }

        console.log("\n--- 4. CREATOR & BRAND LOGIN REGRESSION ---");

        // Scenario 12: Creator and brand behavior remains unchanged
        const creatorLogin = await apiRequest("POST", "/api/auth/login", {
            email: testCreatorEmail,
            password: "CreatorPass123!",
        });
        const brandLogin = await apiRequest("POST", "/api/auth/login", {
            email: testBrandEmail,
            password: "BrandPass123!",
        });
        const creatorAccessAdmin = await apiRequest("GET", "/api/admin/verifications", null, creatorLogin.body?.token);
        const brandAccessAdmin = await apiRequest("GET", "/api/admin/verifications", null, brandLogin.body?.token);

        const regularUsersUntouched =
            creatorLogin.status === 200 &&
            creatorLogin.body?.role === "creator" &&
            brandLogin.status === 200 &&
            brandLogin.body?.role === "brand" &&
            creatorAccessAdmin.status === 403 &&
            brandAccessAdmin.status === 403;

        if (regularUsersUntouched) {
            record("12. Creator and brand behavior remains unchanged", "PASS", "Creator/Brand log in normally and are blocked from admin APIs (403)");
        } else {
            record("12. Creator and brand behavior remains unchanged", "FAIL", `Creator status: ${creatorLogin.status}, Brand status: ${brandLogin.status}`);
        }

    } catch (err) {
        console.error("Test execution error:", err);
        record("Execution error", "FAIL", err.message);
    } finally {
        console.log("\n--- DATABASE CLEANUP ---");
        try {
            if (testUserIds.length) {
                await Promise.all([
                    User.deleteMany({ _id: { $in: testUserIds } }),
                    CreatorProfile.deleteMany({ userId: { $in: testUserIds } }),
                    BrandProfile.deleteMany({ userId: { $in: testUserIds } }),
                ]);
                console.log(`Cleaned up ${testUserIds.length} test users.`);
            }
            const orphanCount = await User.countDocuments({ email: { $regex: /^phase4b2_/i } });
            console.log(`Remaining orphan records: ${orphanCount}`);
        } catch (cleanupErr) {
            console.error("Cleanup error:", cleanupErr);
        }

        server.close();
        await mongoose.disconnect();
    }

    console.log("\n==========================================");
    console.log("            TEST RUN SUMMARY              ");
    console.log("==========================================");
    const passCount = results.filter((r) => r.status === "PASS").length;
    const failCount = results.filter((r) => r.status === "FAIL").length;
    console.log(`TOTAL:  ${results.length}`);
    console.log(`PASSED: ${passCount}`);
    console.log(`FAILED: ${failCount}`);
    console.log(`RATE:   ${passCount}/${results.length}`);
    console.log("==========================================");

    process.exit(failCount === 0 ? 0 : 1);
}

runPhase4B2Tests();
