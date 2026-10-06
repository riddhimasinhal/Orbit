const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const User = require("./models/User");
const CreatorProfile = require("./models/CreatorProfile");
const BrandProfile = require("./models/BrandProfile");
const Campaign = require("./models/Campaign");
const Application = require("./models/Application");
const Collaboration = require("./models/Collaboration");
const Connection = require("./models/Connection");
const Conversation = require("./models/Conversation");
const PortfolioItem = require("./models/PortfolioItem");

const authRoutes = require("./routes/authRoutes");
const creatorRoutes = require("./routes/creatorRoutes");
const brandRoutes = require("./routes/brandRoutes");
const connectionRoutes = require("./routes/connectionRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const campaignRoutes = require("./routes/campaignRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const collaborationRoutes = require("./routes/collaborationRoutes");
const portfolioRoutes = require("./routes/portfolioRoutes");
const verificationRoutes = require("./routes/verificationRoutes");
const adminRoutes = require("./routes/adminRoutes");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

function createTestApp() {
    const app = express();
    app.use(express.json());
    app.use("/api/auth", authRoutes);
    app.use("/api/creator", creatorRoutes);
    app.use("/api/creators", creatorRoutes);
    app.use("/api/brand", brandRoutes);
    app.use("/api/connections", connectionRoutes);
    app.use("/api/conversations", conversationRoutes);
    app.use("/api/campaigns", campaignRoutes);
    app.use("/api/applications", applicationRoutes);
    app.use("/api/collaborations", collaborationRoutes);
    app.use("/api/portfolio", portfolioRoutes);
    app.use("/api/verification", verificationRoutes);
    app.use("/api/admin", adminRoutes);
    return app;
}

function generateToken(user) {
    return jwt.sign(
        {
            userId: user._id,
            role: user.role,
            onBoardingCompleted: user.onBoardingCompleted,
        },
        JWT_SECRET,
        { expiresIn: "1h" }
    );
}

async function runPhase4BTests() {
    console.log("==========================================");
    console.log("   ORBIT PHASE 4B E2E VALIDATION SUITE    ");
    console.log("==========================================");

    let connectedTo = "";
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: "Orbit", serverSelectionTimeoutMS: 5000 });
        connectedTo = "MongoDB Atlas Live Cluster";
    } catch (err) {
        console.log("Atlas connection timed out. Falling back to local MongoDB on 127.0.0.1:27017...");
        await mongoose.connect("mongodb://127.0.0.1:27017/Orbit_Phase4B_Test", { serverSelectionTimeoutMS: 5000 });
        connectedTo = "Local MongoDB (127.0.0.1:27017/Orbit_Phase4B_Test)";
    }
    console.log(`Connected to: ${connectedTo}\n`);

    const app = createTestApp();
    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    async function apiRequest(method, path, body = null, token = null) {
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = token;
        const opts = { method, headers };
        if (body) opts.body = JSON.stringify(body);
        const res = await fetch(`${baseUrl}${path}`, opts);
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

    try {
        const now = Date.now();
        // Cleanup old disposable test data
        const filter = { email: { $regex: /^phase4b_test_/ } };
        const existingUsers = await User.find(filter);
        const existingIds = existingUsers.map((u) => u._id);
        if (existingIds.length) {
            await Promise.all([
                User.deleteMany({ _id: { $in: existingIds } }),
                CreatorProfile.deleteMany({ userId: { $in: existingIds } }),
                BrandProfile.deleteMany({ userId: { $in: existingIds } }),
                PortfolioItem.deleteMany({ creatorId: { $in: existingIds } }),
            ]);
        }

        // Create test users
        // 1. Creator 1
        const creator1 = await User.create({
            name: "Phase4B Creator One",
            email: `phase4b_test_creator1_${now}@example.com`,
            password: "hashedpassword123",
            role: "creator",
            onBoardingCompleted: true,
        });
        const profile1 = await CreatorProfile.create({
            userId: creator1._id,
            fullName: "Phase4B Creator One",
            username: `p4bcreator1_${now}`,
            bio: "Tech content creator",
            niche: ["Tech"],
            verificationStatus: "unverified",
        });
        const creator1Token = generateToken(creator1);

        // 2. Creator 2
        const creator2 = await User.create({
            name: "Phase4B Creator Two",
            email: `phase4b_test_creator2_${now}@example.com`,
            password: "hashedpassword123",
            role: "creator",
            onBoardingCompleted: true,
        });
        const profile2 = await CreatorProfile.create({
            userId: creator2._id,
            fullName: "Phase4B Creator Two",
            username: `p4bcreator2_${now}`,
            bio: "Fitness & lifestyle creator",
            niche: ["Fitness"],
            verificationStatus: "unverified",
        });
        const creator2Token = generateToken(creator2);

        // 3. Brand
        const brand = await User.create({
            name: "Phase4B Brand One",
            email: `phase4b_test_brand_${now}@example.com`,
            password: "hashedpassword123",
            role: "brand",
            onBoardingCompleted: true,
        });
        await BrandProfile.create({
            userId: brand._id,
            brandName: "Phase4B Brand One",
            companyWebsite: "https://brand.example.com",
            industry: "Tech",
        });
        const brandToken = generateToken(brand);

        // 4. Admin
        const admin = await User.create({
            name: "Phase4B Admin",
            email: `phase4b_test_admin_${now}@example.com`,
            password: "hashedpassword123",
            role: "admin",
            onBoardingCompleted: true,
        });
        const adminToken = generateToken(admin);

        console.log("--- 1. CREATOR REQUEST FLOW ---");

        // Scenario 1: Unauthenticated user cannot request verification
        {
            const res = await apiRequest("POST", "/api/verification/request", {});
            const passed = res.status === 401;
            record("1. Unauthenticated user cannot request verification", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 2: Brand cannot request creator verification
        {
            const res = await apiRequest("POST", "/api/verification/request", {}, brandToken);
            const passed = res.status === 403;
            record("2. Brand cannot request creator verification", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 3: Creator can request verification
        {
            const res = await apiRequest("POST", "/api/verification/request", {}, creator1Token);
            const passed = res.status === 200 && res.body?.success === true;
            record("3. Creator can request verification", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 4: Creator status changes from unverified -> pending
        {
            const res = await apiRequest("GET", "/api/verification/me", null, creator1Token);
            const passed = res.status === 200 && (res.body?.status === "pending" || res.body?.verificationStatus === "pending") && res.body?.requestedAt;
            record("4. Creator status changes from unverified -> pending", passed ? "PASS" : "FAIL", `Status: ${res.body?.status}`);
        }

        // Scenario 5: Duplicate pending request is rejected/idempotently handled
        {
            const res = await apiRequest("POST", "/api/verification/request", {}, creator1Token);
            const passed = res.status === 400 || res.status === 409;
            record("5. Duplicate pending request is rejected/idempotently handled", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 6: Creator cannot directly mark themselves verified via profile update
        {
            const res = await apiRequest("PUT", "/api/creator/save-step", { currentStep: 2, fullName: "Phase4B Creator One", verificationStatus: "verified" }, creator1Token);
            const check = await CreatorProfile.findOne({ userId: creator1._id });
            const passed = check.verificationStatus === "pending";
            record("6. Creator cannot directly mark themselves verified", passed ? "PASS" : "FAIL", `Verified status remains: ${check.verificationStatus}`);
        }

        // Scenario 7: Rejected creator can request verification again (tested further down after admin rejection)
        // Set Creator 2 to rejected to test flow
        await CreatorProfile.findOneAndUpdate(
            { userId: creator2._id },
            {
                verificationStatus: "rejected",
                verificationRejectedAt: new Date(),
                verificationRejectionReason: "Incomplete portfolio samples",
            }
        );
        {
            const res = await apiRequest("POST", "/api/verification/request", {}, creator2Token);
            const check = await CreatorProfile.findOne({ userId: creator2._id });
            const passed = res.status === 200 && check.verificationStatus === "pending";
            record("7. Rejected creator can request verification again", passed ? "PASS" : "FAIL", `New status: ${check.verificationStatus}`);
        }

        console.log("\n--- 2. ADMIN SECURITY ---");

        // Scenario 8: Unauthenticated user cannot access admin verification queue
        {
            const res = await apiRequest("GET", "/api/admin/verifications");
            const passed = res.status === 401;
            record("8. Unauthenticated user cannot access admin verification queue", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 9: Creator cannot access admin verification queue
        {
            const res = await apiRequest("GET", "/api/admin/verifications", null, creator1Token);
            const passed = res.status === 403;
            record("9. Creator cannot access admin verification queue", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 10: Brand cannot access admin verification queue
        {
            const res = await apiRequest("GET", "/api/admin/verifications", null, brandToken);
            const passed = res.status === 403;
            record("10. Brand cannot access admin verification queue", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 11: Non-admin cannot approve creator
        {
            const res = await apiRequest("PATCH", `/api/admin/verifications/${creator1._id}/approve`, {}, creator2Token);
            const passed = res.status === 403;
            record("11. Non-admin cannot approve creator", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 12: Non-admin cannot reject creator
        {
            const res = await apiRequest("PATCH", `/api/admin/verifications/${creator1._id}/reject`, { reason: "test" }, brandToken);
            const passed = res.status === 403;
            record("12. Non-admin cannot reject creator", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        console.log("\n--- 3. ADMIN WORKFLOW ---");

        // Scenario 13: Admin can retrieve pending verification requests
        {
            const res = await apiRequest("GET", "/api/admin/verifications", null, adminToken);
            const passed = res.status === 200 && Array.isArray(res.body?.requests) && res.body?.requests.length >= 2;
            record("13. Admin can retrieve pending verification requests", passed ? "PASS" : "FAIL", `Found: ${res.body?.requests?.length}`);
        }

        // Scenario 14: Admin can approve a pending creator
        let approveRes = null;
        {
            approveRes = await apiRequest("PATCH", `/api/admin/verifications/${creator1._id}/approve`, {}, adminToken);
            const passed = approveRes.status === 200 && approveRes.body?.creator?.verificationStatus === "verified";
            record("14. Admin can approve a pending creator", passed ? "PASS" : "FAIL", `Status: ${approveRes.body?.creator?.verificationStatus}`);
        }

        // Scenario 15: Approval sets verifiedAt
        {
            const check = await CreatorProfile.findOne({ userId: creator1._id });
            const passed = check.verifiedAt !== null && check.verifiedAt instanceof Date;
            record("15. Approval sets verifiedAt", passed ? "PASS" : "FAIL", `verifiedAt: ${check.verifiedAt}`);
        }

        // Scenario 16: Approval records verifiedBy
        {
            const check = await CreatorProfile.findOne({ userId: creator1._id });
            const passed = check.verifiedBy && check.verifiedBy.toString() === admin._id.toString();
            record("16. Approval records verifiedBy", passed ? "PASS" : "FAIL", `verifiedBy: ${check.verifiedBy}`);
        }

        // Scenario 17: Verified creator cannot submit another verification request
        {
            const res = await apiRequest("POST", "/api/verification/request", {}, creator1Token);
            const passed = res.status === 400;
            record("17. Verified creator cannot submit another verification request", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 18: Admin cannot reject an already verified creator through normal rejection endpoint
        {
            const res = await apiRequest("PATCH", `/api/admin/verifications/${creator1._id}/reject`, { reason: "Should fail" }, adminToken);
            const passed = res.status === 400;
            record("18. Admin cannot reject an already verified creator", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 19: Admin can reject a pending creator (Creator 2 is currently pending)
        {
            const res = await apiRequest("PATCH", `/api/admin/verifications/${creator2._id}/reject`, { reason: "Portfolio links broken" }, adminToken);
            const passed = res.status === 200 && res.body?.creator?.verificationStatus === "rejected";
            record("19. Admin can reject a pending creator", passed ? "PASS" : "FAIL", `Status: ${res.body?.creator?.verificationStatus}`);
        }

        // Scenario 20: Rejection requires a reason
        {
            // Set Creator 2 temporarily back to pending to test empty reason
            await CreatorProfile.findOneAndUpdate({ userId: creator2._id }, { verificationStatus: "pending" });
            const res = await apiRequest("PATCH", `/api/admin/verifications/${creator2._id}/reject`, { reason: "" }, adminToken);
            const passed = res.status === 400;
            record("20. Rejection requires a reason", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 21: Rejection stores the reason
        {
            const res = await apiRequest("PATCH", `/api/admin/verifications/${creator2._id}/reject`, { reason: "Need high-res work samples" }, adminToken);
            const check = await CreatorProfile.findOne({ userId: creator2._id });
            const passed = res.status === 200 && check.verificationRejectionReason === "Need high-res work samples";
            record("21. Rejection stores the reason", passed ? "PASS" : "FAIL", `Reason: ${check.verificationRejectionReason}`);
        }

        // Scenario 22: Rejected creator can request verification again
        {
            const res = await apiRequest("POST", "/api/verification/request", {}, creator2Token);
            const check = await CreatorProfile.findOne({ userId: creator2._id });
            const passed = res.status === 200 && check.verificationStatus === "pending";
            record("22. Rejected creator can request verification again", passed ? "PASS" : "FAIL", `New status: ${check.verificationStatus}`);
        }

        console.log("\n--- 4. PUBLIC TRUST SIGNAL ---");

        // Scenario 23: Verified status appears on creator detail
        {
            const res = await apiRequest("GET", `/api/creators/${profile1._id}`, null, brandToken);
            const passed = res.status === 200 && res.body?.creator?.verificationStatus === "verified";
            record("23. Verified status appears on creator detail", passed ? "PASS" : "FAIL", `Detail verificationStatus: ${res.body?.creator?.verificationStatus}`);
        }

        // Scenario 24: Verified status appears on creator browse/card
        {
            const res = await apiRequest("GET", `/api/creators/all?limit=50`, null, brandToken);
            const creators = res.body?.creators || [];
            const found1 = creators.find((c) => c._id === profile1._id.toString());
            const passed = res.status === 200 && found1 && found1.verificationStatus === "verified";
            record("24. Verified status appears on creator browse/card", passed ? "PASS" : "FAIL", `Found in browse: ${found1?.verificationStatus}`);
        }

        // Scenario 25: Pending creator does not display a verified badge (Creator 2 is pending)
        {
            const res = await apiRequest("GET", `/api/creators/${profile2._id}`, null, brandToken);
            const passed = res.status === 200 && res.body?.creator?.verificationStatus === "pending" && res.body?.creator?.verificationStatus !== "verified";
            record("25. Pending creator does not display a verified badge", passed ? "PASS" : "FAIL", `Status: ${res.body?.creator?.verificationStatus}`);
        }

        // Scenario 26: Unverified creator does not display a verified badge
        // Set Creator 2 to unverified
        await CreatorProfile.findOneAndUpdate({ userId: creator2._id }, { verificationStatus: "unverified" });
        {
            const res = await apiRequest("GET", `/api/creators/${profile2._id}`, null, brandToken);
            const passed = res.status === 200 && res.body?.creator?.verificationStatus === "unverified";
            record("26. Unverified creator does not display a verified badge", passed ? "PASS" : "FAIL", `Status: ${res.body?.creator?.verificationStatus}`);
        }

        // Scenario 27: Brand cannot see internal verifiedBy information
        {
            const res = await apiRequest("GET", `/api/creators/${profile1._id}`, null, brandToken);
            const passed = res.status === 200 && res.body?.creator?.verifiedBy === undefined;
            record("27. Brand cannot see internal verifiedBy information", passed ? "PASS" : "FAIL", `verifiedBy exposed: ${Boolean(res.body?.creator?.verifiedBy)}`);
        }

        console.log("\n--- 5. REGRESSION (PHASES 0 - 4A.1) ---");

        // Scenario 28: Existing creator browse works
        {
            const res = await apiRequest("GET", "/api/creators/all", null, brandToken);
            const passed = res.status === 200 && Array.isArray(res.body?.creators);
            record("28. Existing creator browse works", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 29: Existing creator detail works
        {
            const res = await apiRequest("GET", `/api/creators/${profile1._id}`, null, brandToken);
            const passed = res.status === 200 && res.body?.creator?.fullName === "Phase4B Creator One";
            record("29. Existing creator detail works", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 30: Existing portfolio works
        {
            const item = await PortfolioItem.create({
                creatorId: creator1._id,
                title: "Phase 4B Demo Reel",
                mediaUrl: "https://example.com/demo.mp4",
                mediaType: "video",
            });
            const res = await apiRequest("GET", "/api/portfolio/mine", null, creator1Token);
            const passed = res.status === 200 && Array.isArray(res.body?.portfolioItems) && res.body?.portfolioItems.length >= 1;
            record("30. Existing portfolio works", passed ? "PASS" : "FAIL", `Items: ${res.body?.portfolioItems?.length}`);
            await PortfolioItem.findByIdAndDelete(item._id);
        }

        // Scenario 31: Existing campaigns work
        {
            const res = await apiRequest("GET", "/api/campaigns", null, creator1Token);
            const passed = res.status === 200 && Array.isArray(res.body?.campaigns);
            record("31. Existing campaigns work", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 32: Existing applications work
        {
            const res = await apiRequest("GET", "/api/applications/mine", null, creator1Token);
            const passed = res.status === 200 && Array.isArray(res.body?.applications);
            record("32. Existing applications work", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 33: Existing collaborations work
        {
            const res = await apiRequest("GET", "/api/collaborations/mine", null, creator1Token);
            const passed = res.status === 200 && Array.isArray(res.body?.collaborations);
            record("33. Existing collaborations work", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 34: Existing messaging works
        {
            const res = await apiRequest("GET", "/api/conversations", null, creator1Token);
            const passed = res.status === 200 && Array.isArray(res.body?.conversations);
            record("34. Existing messaging works", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        console.log("\n--- 6. DATABASE CLEANUP ---");
        const remainingTestItems = await PortfolioItem.find({ creatorId: { $in: [creator1._id, creator2._id] } });
        console.log(`Found ${remainingTestItems.length} test portfolio items.`);

        await Promise.all([
            User.deleteMany({ _id: { $in: [creator1._id, creator2._id, brand._id, admin._id] } }),
            CreatorProfile.deleteMany({ userId: { $in: [creator1._id, creator2._id] } }),
            BrandProfile.deleteMany({ userId: brand._id }),
            PortfolioItem.deleteMany({ creatorId: { $in: [creator1._id, creator2._id] } }),
        ]);
        console.log("Cleaned up disposable test users, profiles, and portfolio items from MongoDB Atlas.");

        // Summary
        console.log("\n==========================================");
        const passedCount = results.filter((r) => r.status === "PASS").length;
        const failedCount = results.filter((r) => r.status === "FAIL").length;
        console.log(
            `TOTAL SCENARIOS: ${results.length} | PASSED: ${passedCount} | FAILED: ${failedCount}`
        );
        console.log("==========================================");

        server.close();
        await mongoose.disconnect();
        return failedCount === 0;
    } catch (err) {
        console.error("Test execution error:", err);
        server.close();
        await mongoose.disconnect();
        return false;
    }
}

runPhase4BTests().then((success) => {
    process.exit(success ? 0 : 1);
});
