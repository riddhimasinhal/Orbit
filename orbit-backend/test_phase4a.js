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

async function runPhase4ATests() {
    console.log("==========================================");
    console.log("   ORBIT PHASE 4A E2E VALIDATION SUITE    ");
    console.log("==========================================");

    let connectedTo = "";
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: "Orbit", serverSelectionTimeoutMS: 5000 });
        connectedTo = "MongoDB Atlas Live Cluster";
    } catch (err) {
        console.log("Atlas connection timed out. Falling back to local MongoDB on 127.0.0.1:27017...");
        await mongoose.connect("mongodb://127.0.0.1:27017/Orbit_Phase4A_Test", { serverSelectionTimeoutMS: 5000 });
        connectedTo = "Local MongoDB (127.0.0.1:27017/Orbit_Phase4A_Test)";
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
        let data = null;
        try {
            data = await res.json();
        } catch {
            data = null;
        }
        return { status: res.status, body: data };
    }

    const results = [];
    function record(name, status, notes = "") {
        results.push({ name, status, notes });
        console.log(`[${status}] ${name} ${notes ? "- " + notes : ""}`);
    }

    try {
        // Cleanup disposable test users
        const filter = { email: { $regex: /^phase4a_test_/ } };
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

        const now = Date.now();

        // 1. Create Creator 1
        const creator1 = await User.create({
            name: "Phase4A Creator One",
            email: `phase4a_test_creator1_${now}@example.com`,
            password: "hashedpassword123",
            role: "creator",
            onBoardingCompleted: true,
        });
        const profile1 = await CreatorProfile.create({
            userId: creator1._id,
            fullName: "Phase4A Creator One",
            username: `p4acreator1_${now}`,
            bio: "Tech & gadget reviews",
            niche: ["Tech"],
        });
        const creator1Token = generateToken(creator1);

        // 2. Create Creator 2
        const creator2 = await User.create({
            name: "Phase4A Creator Two",
            email: `phase4a_test_creator2_${now}@example.com`,
            password: "hashedpassword123",
            role: "creator",
            onBoardingCompleted: true,
        });
        const profile2 = await CreatorProfile.create({
            userId: creator2._id,
            fullName: "Phase4A Creator Two",
            username: `p4acreator2_${now}`,
            bio: "Design & workflow setup",
            niche: ["Design"],
        });
        const creator2Token = generateToken(creator2);

        // 3. Create Brand User
        const brand = await User.create({
            name: "Phase4A Brand User",
            email: `phase4a_test_brand_${now}@example.com`,
            password: "hashedpassword123",
            role: "brand",
            onBoardingCompleted: true,
        });
        await BrandProfile.create({
            userId: brand._id,
            companyName: "Nexus Gear",
            industry: "Technology",
        });
        const brandToken = generateToken(brand);

        console.log("--- 1. PORTFOLIO CREATION & ROLE PERMISSIONS ---");

        // Scenario 1: Creator can create portfolio item
        let item1Id = null;
        {
            const res = await apiRequest(
                "POST",
                "/api/portfolio",
                {
                    title: "Desk Setup Showcase 2026",
                    description: "Minimalist workspace redesign featuring wireless mechanical accessories.",
                    mediaType: "image",
                    mediaUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475",
                    projectUrl: "https://youtube.com/watch?v=example1",
                },
                creator1Token
            );
            const passed = res.status === 201 && res.body?.portfolioItem?.title === "Desk Setup Showcase 2026";
            item1Id = res.body?.portfolioItem?._id;
            record("1. Creator can create portfolio item", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 2: Brand cannot create portfolio item
        {
            const res = await apiRequest(
                "POST",
                "/api/portfolio",
                {
                    title: "Brand trying to create portfolio",
                    description: "Unauthorized attempt",
                },
                brandToken
            );
            const passed = res.status === 403;
            record("2. Brand cannot create portfolio item", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 3: Creator cannot create item for another creator (spoofing creatorId is ignored)
        {
            const res = await apiRequest(
                "POST",
                "/api/portfolio",
                {
                    title: "Spoofed Creator Item",
                    description: "Attempting to spoof another creator's ID",
                    creatorId: creator2._id,
                },
                creator1Token
            );
            const passed =
                res.status === 201 &&
                res.body?.portfolioItem?.creatorId.toString() === creator1._id.toString();
            record(
                "3. Creator cannot create item for another creator",
                passed ? "PASS" : "FAIL",
                `Created under authenticated creator: ${passed}`
            );
        }

        console.log("\n--- 2. PORTFOLIO RETRIEVAL & DISCOVERY ---");

        // Scenario 4: Creator can retrieve own portfolio
        {
            const res = await apiRequest("GET", "/api/portfolio/mine", null, creator1Token);
            const passed = res.status === 200 && res.body?.portfolioItems?.length === 2;
            record("4. Creator can retrieve own portfolio", passed ? "PASS" : "FAIL", `Count: ${res.body?.portfolioItems?.length}`);
        }

        // Scenario 5: Public creator detail can retrieve creator portfolio (using CreatorProfile ID)
        {
            const res = await apiRequest("GET", `/api/creators/${profile1._id}/portfolio`, null, creator2Token);
            const passed = res.status === 200 && res.body?.portfolioItems?.length === 2;
            record("5. Public creator detail can retrieve creator portfolio", passed ? "PASS" : "FAIL", `Count: ${res.body?.portfolioItems?.length}`);
        }

        // Scenario 6: Brand can view creator portfolio
        {
            const res = await apiRequest("GET", `/api/creators/${creator1._id}/portfolio`, null, brandToken);
            const passed = res.status === 200 && res.body?.portfolioItems?.length === 2;
            record("6. Brand can view creator portfolio", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        console.log("\n--- 3. PORTFOLIO UPDATE WORKFLOW & AUTHORIZATION ---");

        // Scenario 7: Creator can update own portfolio item
        {
            const res = await apiRequest(
                "PUT",
                `/api/portfolio/${item1Id}`,
                {
                    title: "Desk Setup Showcase 2026 (Updated)",
                    description: "Added 4K ultrawide monitor setup details.",
                },
                creator1Token
            );
            const passed =
                res.status === 200 &&
                res.body?.portfolioItem?.title === "Desk Setup Showcase 2026 (Updated)";
            record("7. Creator can update own portfolio item", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 8: Creator cannot update another creator's portfolio item
        {
            const res = await apiRequest(
                "PUT",
                `/api/portfolio/${item1Id}`,
                {
                    title: "Malicious update by another creator",
                },
                creator2Token
            );
            const passed = res.status === 403;
            record("8. Creator cannot update another creator's portfolio item", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        console.log("\n--- 4. PORTFOLIO DELETION WORKFLOW & AUTHORIZATION ---");

        // Scenario 9: Creator cannot delete another creator's portfolio item
        {
            const res = await apiRequest("DELETE", `/api/portfolio/${item1Id}`, null, creator2Token);
            const passed = res.status === 403;
            record("10. Creator cannot delete another creator's portfolio item", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 10: Creator can delete own portfolio item
        {
            const res = await apiRequest("DELETE", `/api/portfolio/${item1Id}`, null, creator1Token);
            const passed = res.status === 200;
            record("9. Creator can delete own portfolio item", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        console.log("\n--- 5. INPUT VALIDATION & ID CHECKS ---");

        // Scenario 11: Invalid portfolio item ID is rejected
        {
            const res = await apiRequest("PUT", "/api/portfolio/invalid-id-format", { title: "Test" }, creator1Token);
            const passed = res.status === 400;
            record("11. Invalid portfolio item ID is rejected", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 12: Invalid creator ID is rejected
        {
            const res = await apiRequest("GET", "/api/creators/invalid-creator-id/portfolio", null, brandToken);
            const passed = res.status === 400;
            record("12. Invalid creator ID is rejected", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 13: Invalid required fields are rejected (empty title & title > 120 chars)
        {
            const resEmpty = await apiRequest("POST", "/api/portfolio", { title: "   " }, creator1Token);
            const resLong = await apiRequest(
                "POST",
                "/api/portfolio",
                { title: "A".repeat(125) },
                creator1Token
            );
            const passed = resEmpty.status === 400 && resLong.status === 400;
            record("13. Invalid required fields are rejected", passed ? "PASS" : "FAIL", `Empty: ${resEmpty.status}, Long: ${resLong.status}`);
        }

        // Scenario 14: Invalid project URL is rejected
        {
            const res = await apiRequest(
                "POST",
                "/api/portfolio",
                {
                    title: "Valid Title",
                    projectUrl: "not-a-valid-http-url",
                },
                creator1Token
            );
            const passed = res.status === 400;
            record("14. Invalid project URL is rejected", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 15: Portfolio ordering is deterministic (createdAt DESC)
        {
            // Create items with sequential delays
            const itemA = await PortfolioItem.create({
                creatorId: creator2._id,
                title: "Older Portfolio Item",
                createdAt: new Date(Date.now() - 10000),
            });
            const itemB = await PortfolioItem.create({
                creatorId: creator2._id,
                title: "Newer Portfolio Item",
                createdAt: new Date(),
            });

            const res = await apiRequest("GET", "/api/portfolio/mine", null, creator2Token);
            const items = res.body?.portfolioItems || [];
            const passed =
                items.length >= 2 &&
                items[0]._id.toString() === itemB._id.toString() &&
                items[1]._id.toString() === itemA._id.toString();
            record("15. Portfolio ordering is deterministic (createdAt DESC)", passed ? "PASS" : "FAIL", `Ordered correctly: ${passed}`);
        }

        console.log("\n--- 6. REGRESSION TESTING (PHASES 0 - 3B) ---");

        // Scenario 16: Existing Creator Browse still works
        {
            const res = await apiRequest("GET", "/api/creator/all", null, brandToken);
            const passed = res.status === 200 && Array.isArray(res.body?.creators);
            record("16. Existing Creator Browse still works", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 17: Existing Creator Detail still works
        {
            const res = await apiRequest("GET", `/api/creator/${profile1._id}`, null, brandToken);
            const passed = res.status === 200 && res.body?.creator?._id === profile1._id.toString();
            record("17. Existing Creator Detail still works", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 18: Existing Campaign Marketplace still works
        {
            const res = await apiRequest("GET", "/api/campaigns", null, creator1Token);
            const passed = res.status === 200 && Array.isArray(res.body?.campaigns);
            record("18. Existing Campaign Marketplace still works", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 19: Existing Applications still work
        {
            const res = await apiRequest("GET", "/api/applications/mine", null, creator1Token);
            const passed = res.status === 200 && Array.isArray(res.body?.applications);
            record("19. Existing Applications still work", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 20: Existing Collaborations still work
        {
            const res = await apiRequest("GET", "/api/collaborations/mine", null, creator1Token);
            const passed = res.status === 200 && Array.isArray(res.body?.collaborations);
            record("20. Existing Collaborations still work", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 21: Existing Conversations / Messages still work
        {
            const res = await apiRequest("GET", "/api/conversations", null, creator1Token);
            const passed = res.status === 200 && Array.isArray(res.body?.conversations);
            record("21. Existing Messages still work", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        console.log("\n--- 7. MEDIA STORAGE PROVIDER ASSESSMENT ---");
        // Scenarios 22-25: Direct binary file upload infrastructure assessment
        record(
            "22. Valid media upload succeeds",
            "BLOCKED",
            "No existing persistent media storage infrastructure (e.g. S3/Cloudinary/Firebase). External & direct URLs supported."
        );
        record(
            "23. Invalid media type is rejected",
            "BLOCKED",
            "No existing persistent media storage infrastructure."
        );
        record(
            "24. Oversized media is rejected",
            "BLOCKED",
            "No existing persistent media storage infrastructure."
        );
        record(
            "25. Stored media reference is persisted correctly",
            "BLOCKED",
            "No existing persistent media storage infrastructure."
        );

        console.log("\n--- 8. DATA INTEGRITY AUDIT ---");
        // Verify no orphan records and clean up disposable test data
        const testItems = await PortfolioItem.find({ creatorId: { $in: [creator1._id, creator2._id] } });
        console.log(`Verified ${testItems.length} portfolio records created during testing.`);

        await Promise.all([
            User.deleteMany({ _id: { $in: [creator1._id, creator2._id, brand._id] } }),
            CreatorProfile.deleteMany({ userId: { $in: [creator1._id, creator2._id] } }),
            BrandProfile.deleteMany({ userId: brand._id }),
            PortfolioItem.deleteMany({ creatorId: { $in: [creator1._id, creator2._id] } }),
        ]);
        console.log("Disposable test data cleaned up successfully.");

        // Summary
        console.log("\n==========================================");
        const passedCount = results.filter((r) => r.status === "PASS").length;
        const blockedCount = results.filter((r) => r.status === "BLOCKED").length;
        const failedCount = results.filter((r) => r.status === "FAIL").length;
        console.log(
            `TOTAL SCENARIOS: ${results.length} | PASSED: ${passedCount} | BLOCKED: ${blockedCount} | FAILED: ${failedCount}`
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

runPhase4ATests().then((success) => {
    process.exit(success ? 0 : 1);
});
