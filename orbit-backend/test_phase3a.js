const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const User = require("./models/User");
const CreatorProfile = require("./models/CreatorProfile");
const BrandProfile = require("./models/BrandProfile");
const Campaign = require("./models/Campaign");
const Connection = require("./models/Connection");
const Conversation = require("./models/Conversation");

const authRoutes = require("./routes/authRoutes");
const creatorRoutes = require("./routes/creatorRoutes");
const brandRoutes = require("./routes/brandRoutes");
const connectionRoutes = require("./routes/connectionRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const campaignRoutes = require("./routes/campaignRoutes");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

function createTestApp() {
    const app = express();
    app.use(express.json());
    app.use("/api/auth", authRoutes);
    app.use("/api/creator", creatorRoutes);
    app.use("/api/brand", brandRoutes);
    app.use("/api/connections", connectionRoutes);
    app.use("/api/conversations", conversationRoutes);
    app.use("/api/campaigns", campaignRoutes);
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

async function runPhase3ATests() {
    console.log("==========================================");
    console.log("   ORBIT PHASE 3A E2E VALIDATION SUITE    ");
    console.log("==========================================");

    let connectedTo = "";
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: "Orbit", serverSelectionTimeoutMS: 5000 });
        connectedTo = "MongoDB Atlas Live Cluster";
    } catch (err) {
        console.log("Atlas connection timed out. Falling back to local MongoDB on 127.0.0.1:27017...");
        await mongoose.connect("mongodb://127.0.0.1:27017/Orbit_Phase3A_Test", { serverSelectionTimeoutMS: 5000 });
        connectedTo = "Local MongoDB (127.0.0.1:27017/Orbit_Phase3A_Test)";
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
    function record(name, passed, detail) {
        results.push({ name, passed, detail });
        console.log(`[${passed ? "PASS" : "FAIL"}] ${name} ${detail ? "- " + detail : ""}`);
    }

    try {
        // Cleanup existing test users with phase3a prefix
        const filter = { email: { $regex: /^phase3a_test_/ } };
        const existingUsers = await User.find(filter);
        const existingIds = existingUsers.map(u => u._id);
        if (existingIds.length) {
            await Promise.all([
                User.deleteMany({ _id: { $in: existingIds } }),
                CreatorProfile.deleteMany({ userId: { $in: existingIds } }),
                BrandProfile.deleteMany({ userId: { $in: existingIds } }),
                Campaign.deleteMany({ brandId: { $in: existingIds } }),
            ]);
        }

        // Create Test Users
        // 1. Brand 1 (Owner)
        const brand1 = await User.create({
            name: "Phase3A Alpha Brand",
            fullName: "Phase3A Alpha Brand",
            companyName: "Alpha Cosmetics",
            email: `phase3a_test_brand1_${Date.now()}@example.com`,
            password: "hashedpassword123",
            role: "brand",
            onBoardingCompleted: true,
        });
        await BrandProfile.create({
            userId: brand1._id,
            companyName: "Alpha Cosmetics",
            industry: "Beauty & Skincare",
            location: "Los Angeles, CA",
        });

        // 2. Brand 2 (Unrelated Brand)
        const brand2 = await User.create({
            name: "Phase3A Beta Brand",
            fullName: "Phase3A Beta Brand",
            companyName: "Beta Electronics",
            email: `phase3a_test_brand2_${Date.now()}@example.com`,
            password: "hashedpassword123",
            role: "brand",
            onBoardingCompleted: true,
        });
        await BrandProfile.create({
            userId: brand2._id,
            companyName: "Beta Electronics",
            industry: "Consumer Electronics",
            location: "Austin, TX",
        });

        // 3. Creator 1
        const creator1 = await User.create({
            name: "Phase3A Chloe Creator",
            fullName: "Phase3A Chloe Creator",
            email: `phase3a_test_creator1_${Date.now()}@example.com`,
            password: "hashedpassword123",
            role: "creator",
            onBoardingCompleted: true,
        });
        await CreatorProfile.create({
            userId: creator1._id,
            fullName: "Phase3A Chloe Creator",
            username: `chloe_${Date.now()}`,
            bio: "Beauty & Fashion Vlogger",
            niche: ["Beauty", "Fashion"],
            location: "New York, NY",
        });

        const tokenBrand1 = generateToken(brand1);
        const tokenBrand2 = generateToken(brand2);
        const tokenCreator1 = generateToken(creator1);

        let createdCampaignId = null;

        // Test 1: Brand can create campaign
        const resCreate = await apiRequest("POST", "/api/campaigns", {
            title: "Summer Hydration Serum Launch",
            description: "Promoting our new natural hydration serum with Instagram reels.",
            niche: ["Beauty", "Lifestyle"],
            budgetMin: 500,
            budgetMax: 1500,
            deliverables: ["1x Instagram Reel", "2x Instagram Stories"],
            applicationDeadline: new Date(Date.now() + 15 * 86400000).toISOString(),
            startDate: new Date(Date.now() + 20 * 86400000).toISOString(),
            endDate: new Date(Date.now() + 40 * 86400000).toISOString(),
        }, tokenBrand1);

        createdCampaignId = resCreate.body?.campaign?._id;
        record(
            "1. Brand can create campaign",
            resCreate.status === 201 && Boolean(createdCampaignId),
            `Status: ${resCreate.status}, CampaignId: ${createdCampaignId}`
        );

        // Test 2: Creator cannot create campaign
        const resCreatorCreate = await apiRequest("POST", "/api/campaigns", {
            title: "Unauthorized Campaign",
            description: "Should fail",
        }, tokenCreator1);
        record(
            "2. Creator cannot create campaign",
            resCreatorCreate.status === 403,
            `Status: ${resCreatorCreate.status}, Message: ${resCreatorCreate.body?.message}`
        );

        // Test 3: Campaign is saved as draft
        const resDraftCheck = await apiRequest("GET", `/api/campaigns/${createdCampaignId}`, null, tokenBrand1);
        record(
            "3. Campaign is saved as draft",
            resDraftCheck.status === 200 && resDraftCheck.body?.campaign?.status === "draft",
            `Status: ${resDraftCheck.body?.campaign?.status}`
        );

        // Test 4: Brand can edit own draft
        const resEdit = await apiRequest("PUT", `/api/campaigns/${createdCampaignId}`, {
            title: "Summer Hydration Serum Launch (Updated)",
            budgetMax: 2000,
        }, tokenBrand1);
        record(
            "4. Brand can edit own draft",
            resEdit.status === 200 && resEdit.body?.campaign?.title === "Summer Hydration Serum Launch (Updated)" && resEdit.body?.campaign?.budgetMax === 2000,
            `Status: ${resEdit.status}, Updated Title: ${resEdit.body?.campaign?.title}`
        );

        // Test 5: Brand can publish valid campaign
        const resPublish = await apiRequest("PATCH", `/api/campaigns/${createdCampaignId}/publish`, {}, tokenBrand1);
        record(
            "5. Brand can publish valid campaign",
            resPublish.status === 200 && resPublish.body?.campaign?.status === "published",
            `Status: ${resPublish.status}, Campaign Status: ${resPublish.body?.campaign?.status}`
        );

        // Test 6: Published campaign appears in creator marketplace
        const resMarketplace = await apiRequest("GET", "/api/campaigns", null, tokenCreator1);
        const inMarketplace = resMarketplace.body?.campaigns?.some(c => c._id === createdCampaignId);
        record(
            "6. Published campaign appears in creator marketplace",
            resMarketplace.status === 200 && inMarketplace,
            `Total found: ${resMarketplace.body?.campaigns?.length}, inMarketplace: ${inMarketplace}`
        );

        // Test 7: Creator can view published campaign details
        const resCreatorView = await apiRequest("GET", `/api/campaigns/${createdCampaignId}`, null, tokenCreator1);
        const hasBrandInfo = Boolean(resCreatorView.body?.campaign?.brand?.companyName === "Alpha Cosmetics");
        record(
            "7. Creator can view published campaign",
            resCreatorView.status === 200 && hasBrandInfo,
            `Status: ${resCreatorView.status}, Brand: ${resCreatorView.body?.campaign?.brand?.companyName}`
        );

        // Test 8: Creator cannot view another brand's draft
        const resDraftCreate = await apiRequest("POST", "/api/campaigns", {
            title: "Secret Unreleased Product Draft",
            description: "Internal confidential draft",
            budgetMin: 100,
            budgetMax: 200,
        }, tokenBrand2);
        const draftId = resDraftCreate.body?.campaign?._id;

        const resCreatorViewDraft = await apiRequest("GET", `/api/campaigns/${draftId}`, null, tokenCreator1);
        record(
            "8. Creator cannot view another brand's draft",
            resCreatorViewDraft.status === 404,
            `Status: ${resCreatorViewDraft.status}, Message: ${resCreatorViewDraft.body?.message}`
        );

        // Test 9: Creator cannot modify campaign
        const resCreatorModify = await apiRequest("PUT", `/api/campaigns/${createdCampaignId}`, {
            title: "Hacked Title",
        }, tokenCreator1);
        record(
            "9. Creator cannot modify campaign",
            resCreatorModify.status === 403,
            `Status: ${resCreatorModify.status}`
        );

        // Test 10: Another brand cannot modify campaign
        const resBrand2Modify = await apiRequest("PUT", `/api/campaigns/${createdCampaignId}`, {
            title: "Brand 2 Stolen Title",
        }, tokenBrand2);
        record(
            "10. Another brand cannot modify campaign",
            resBrand2Modify.status === 403,
            `Status: ${resBrand2Modify.status}, Message: ${resBrand2Modify.body?.message}`
        );

        // Test 11: Brand can close own campaign
        const resClose = await apiRequest("PATCH", `/api/campaigns/${createdCampaignId}/close`, {}, tokenBrand1);
        record(
            "11. Brand can close own campaign",
            resClose.status === 200 && resClose.body?.campaign?.status === "closed",
            `Status: ${resClose.status}, Campaign Status: ${resClose.body?.campaign?.status}`
        );

        // Test 12: Closed campaign no longer appears in active creator marketplace
        const resMarketplaceAfterClose = await apiRequest("GET", "/api/campaigns", null, tokenCreator1);
        const stillInMarketplace = resMarketplaceAfterClose.body?.campaigns?.some(c => c._id === createdCampaignId);
        record(
            "12. Closed campaign no longer in creator marketplace",
            resMarketplaceAfterClose.status === 200 && !stillInMarketplace,
            `Still in marketplace: ${stillInMarketplace}`
        );

        // Test 13: Invalid budget is rejected (budgetMin > budgetMax)
        const resInvalidBudget = await apiRequest("POST", "/api/campaigns", {
            title: "Invalid Budget Campaign",
            description: "Testing min > max budget",
            budgetMin: 5000,
            budgetMax: 1000,
        }, tokenBrand1);
        record(
            "13. Invalid budget is rejected",
            resInvalidBudget.status === 400,
            `Status: ${resInvalidBudget.status}, Message: ${resInvalidBudget.body?.message}`
        );

        // Test 14: Invalid date range is rejected (endDate < startDate)
        const resInvalidDates = await apiRequest("POST", "/api/campaigns", {
            title: "Invalid Dates Campaign",
            description: "Testing endDate < startDate",
            startDate: "2026-12-01",
            endDate: "2026-11-01",
        }, tokenBrand1);
        record(
            "14. Invalid date range is rejected",
            resInvalidDates.status === 400,
            `Status: ${resInvalidDates.status}, Message: ${resInvalidDates.body?.message}`
        );

        // Test 15: Pagination works
        // Create 3 published campaigns from Brand 1
        const p1 = await apiRequest("POST", "/api/campaigns", {
            title: "Pagination Test 1",
            description: "Campaign 1 for pagination",
            budgetMax: 500,
            deliverables: ["1x Post"],
            applicationDeadline: new Date(Date.now() + 86400000 * 10).toISOString(),
        }, tokenBrand1);
        await apiRequest("PATCH", `/api/campaigns/${p1.body?.campaign?._id}/publish`, {}, tokenBrand1);

        const p2 = await apiRequest("POST", "/api/campaigns", {
            title: "Pagination Test 2",
            description: "Campaign 2 for pagination",
            budgetMax: 600,
            deliverables: ["1x Video"],
            applicationDeadline: new Date(Date.now() + 86400000 * 10).toISOString(),
        }, tokenBrand1);
        await apiRequest("PATCH", `/api/campaigns/${p2.body?.campaign?._id}/publish`, {}, tokenBrand1);

        const resPaginated = await apiRequest("GET", "/api/campaigns?page=1&limit=1", null, tokenCreator1);
        record(
            "15. Pagination works",
            resPaginated.status === 200 && resPaginated.body?.campaigns?.length === 1 && resPaginated.body?.pagination?.limit === 1,
            `Returned: ${resPaginated.body?.campaigns?.length}, Page: ${resPaginated.body?.pagination?.page}, Total: ${resPaginated.body?.pagination?.total}`
        );

        // Test 16: Existing marketplace regression
        const resBrowseCreators = await apiRequest("GET", "/api/creator/all?page=1&limit=5", null, tokenBrand1);
        const resBrowseBrands = await apiRequest("GET", "/api/brand/all?page=1&limit=5", null, tokenCreator1);
        const resRequestsReceived = await apiRequest("GET", "/api/connections/received", null, tokenCreator1);
        const resPendingCount = await apiRequest("GET", "/api/connections/count", null, tokenCreator1);
        const resConversations = await apiRequest("GET", "/api/conversations", null, tokenCreator1);

        const regressionPass =
            resBrowseCreators.status === 200 &&
            resBrowseBrands.status === 200 &&
            resRequestsReceived.status === 200 &&
            resPendingCount.status === 200 &&
            resConversations.status === 200;

        record(
            "16. Existing marketplace regression",
            regressionPass,
            `Creators: ${resBrowseCreators.status}, Brands: ${resBrowseBrands.status}, Requests: ${resRequestsReceived.status}, Convs: ${resConversations.status}`
        );

        // Cleanup test data
        await Promise.all([
            User.deleteMany({ _id: { $in: [brand1._id, brand2._id, creator1._id] } }),
            BrandProfile.deleteMany({ userId: { $in: [brand1._id, brand2._id] } }),
            CreatorProfile.deleteMany({ userId: { $in: [creator1._id] } }),
            Campaign.deleteMany({ brandId: { $in: [brand1._id, brand2._id] } }),
        ]);

        server.close();
        await mongoose.disconnect();

        console.log("\n==========================================");
        console.log(`TOTAL TESTS: ${results.length}`);
        console.log(`PASSED: ${results.filter(r => r.passed).length}`);
        console.log(`FAILED: ${results.filter(r => !r.passed).length}`);
        console.log("==========================================");

        if (results.every(r => r.passed)) {
            console.log("\n>>> ALL PHASE 3A TESTS PASSED PERFECTLY! <<<");
            process.exit(0);
        } else {
            console.error("\n>>> SOME TESTS FAILED <<<");
            process.exit(1);
        }
    } catch (testErr) {
        console.error("Test execution failed:", testErr);
        server.close();
        await mongoose.disconnect();
        process.exit(1);
    }
}

runPhase3ATests();
