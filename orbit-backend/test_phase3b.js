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

const authRoutes = require("./routes/authRoutes");
const creatorRoutes = require("./routes/creatorRoutes");
const brandRoutes = require("./routes/brandRoutes");
const connectionRoutes = require("./routes/connectionRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const campaignRoutes = require("./routes/campaignRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const collaborationRoutes = require("./routes/collaborationRoutes");

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
    app.use("/api/applications", applicationRoutes);
    app.use("/api/collaborations", collaborationRoutes);
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

async function runPhase3BTests() {
    console.log("==========================================");
    console.log("   ORBIT PHASE 3B E2E VALIDATION SUITE    ");
    console.log("==========================================");

    let connectedTo = "";
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: "Orbit", serverSelectionTimeoutMS: 5000 });
        connectedTo = "MongoDB Atlas Live Cluster";
    } catch (err) {
        console.log("Atlas connection timed out. Falling back to local MongoDB on 127.0.0.1:27017...");
        await mongoose.connect("mongodb://127.0.0.1:27017/Orbit_Phase3B_Test", { serverSelectionTimeoutMS: 5000 });
        connectedTo = "Local MongoDB (127.0.0.1:27017/Orbit_Phase3B_Test)";
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
        // Cleanup existing test users with phase3b prefix
        const filter = { email: { $regex: /^phase3b_test_/ } };
        const existingUsers = await User.find(filter);
        const existingIds = existingUsers.map(u => u._id);
        if (existingIds.length) {
            await Promise.all([
                User.deleteMany({ _id: { $in: existingIds } }),
                CreatorProfile.deleteMany({ userId: { $in: existingIds } }),
                BrandProfile.deleteMany({ userId: { $in: existingIds } }),
                Campaign.deleteMany({ brandId: { $in: existingIds } }),
                Application.deleteMany({ creatorId: { $in: existingIds } }),
                Collaboration.deleteMany({ $or: [{ brandId: { $in: existingIds } }, { creatorId: { $in: existingIds } }] }),
                Connection.deleteMany({ $or: [{ senderId: { $in: existingIds } }, { receiverId: { $in: existingIds } }] }),
            ]);
        }

        const now = Date.now();

        // 1. Create Brand 1 (Owner)
        const brand1 = await User.create({
            name: "Phase3B Tech Brand",
            fullName: "Phase3B Tech Brand",
            companyName: "Nexus Hardware",
            email: `phase3b_test_brand1_${now}@example.com`,
            password: "hashedpassword123",
            role: "brand",
            onBoardingCompleted: true,
        });
        await BrandProfile.create({
            userId: brand1._id,
            companyName: "Nexus Hardware",
            industry: "Technology",
            location: "San Francisco, CA",
        });
        const brand1Token = generateToken(brand1);

        // 2. Create Brand 2 (Unrelated brand)
        const brand2 = await User.create({
            name: "Phase3B Other Brand",
            fullName: "Phase3B Other Brand",
            companyName: "Other Brand Inc",
            email: `phase3b_test_brand2_${now}@example.com`,
            password: "hashedpassword123",
            role: "brand",
            onBoardingCompleted: true,
        });
        await BrandProfile.create({
            userId: brand2._id,
            companyName: "Other Brand Inc",
            industry: "Fashion",
            location: "New York, NY",
        });
        const brand2Token = generateToken(brand2);

        // 3. Create Creator 1
        const creator1 = await User.create({
            name: "Phase3B Tech Creator 1",
            fullName: "Alex Tech",
            email: `phase3b_test_creator1_${now}@example.com`,
            password: "hashedpassword123",
            role: "creator",
            onBoardingCompleted: true,
        });
        await CreatorProfile.create({
            userId: creator1._id,
            handle: `alextech_${now}`,
            bio: "Tech reviews and developer setup guides",
            niche: ["Tech", "Gaming"],
        });
        const creator1Token = generateToken(creator1);

        // 4. Create Creator 2
        const creator2 = await User.create({
            name: "Phase3B Tech Creator 2",
            fullName: "Maya Code",
            email: `phase3b_test_creator2_${now}@example.com`,
            password: "hashedpassword123",
            role: "creator",
            onBoardingCompleted: true,
        });
        await CreatorProfile.create({
            userId: creator2._id,
            handle: `mayacode_${now}`,
            bio: "Coding tutorials and workflow optimization",
            niche: ["Tech", "Education"],
        });
        const creator2Token = generateToken(creator2);

        // 5. Create Creator 3
        const creator3 = await User.create({
            name: "Phase3B Tech Creator 3",
            fullName: "Jordan Build",
            email: `phase3b_test_creator3_${now}@example.com`,
            password: "hashedpassword123",
            role: "creator",
            onBoardingCompleted: true,
        });
        await CreatorProfile.create({
            userId: creator3._id,
            handle: `jordan_${now}`,
            bio: "Hardware mods and mechanical keyboards",
            niche: ["Tech"],
        });
        const creator3Token = generateToken(creator3);

        // 6. Create Campaigns by Brand 1:
        // Campaign A: Published
        const publishedCampaign = await Campaign.create({
            brandId: brand1._id,
            title: "Phase 3B Next-Gen Mechanical Keyboard Review",
            description: "Looking for in-depth YouTube & Reel reviews of our wireless mechanical keyboard.",
            niche: ["Tech", "Gaming"],
            budgetMin: 1000,
            budgetMax: 2500,
            deliverables: ["1x YouTube Integration", "2x Instagram Reels"],
            applicationDeadline: new Date(Date.now() + 30 * 86400000),
            startDate: new Date(),
            endDate: new Date(Date.now() + 60 * 86400000),
            status: "published",
        });

        // Campaign B: Draft
        const draftCampaign = await Campaign.create({
            brandId: brand1._id,
            title: "Phase 3B Draft Campaign",
            description: "Still in drafting phase, not open for applications.",
            niche: ["Tech"],
            budgetMin: 500,
            budgetMax: 1000,
            deliverables: ["1x Post"],
            status: "draft",
        });

        console.log("--- 1. AUTHENTICATION & ACCESS CONTROL ---");
        // Test 1: Unauthenticated request fails
        {
            const res = await apiRequest("POST", `/api/campaigns/${publishedCampaign._id}/applications`, {
                pitch: "I would love to review this keyboard on my tech channel.",
            });
            record("Unauthenticated application returns 401", res.status === 401, `Status: ${res.status}`);
        }

        // Test 2: Brand user cannot apply to campaigns
        {
            const res = await apiRequest(
                "POST",
                `/api/campaigns/${publishedCampaign._id}/applications`,
                { pitch: "I am a brand but want to apply." },
                brand2Token
            );
            record("Brand cannot apply to campaign (403)", res.status === 403, `Status: ${res.status}`);
        }

        console.log("\n--- 2. INPUT VALIDATION & APPLICATION CREATION ---");
        // Test 3: Application to non-existent campaign returns 404
        {
            const fakeId = new mongoose.Types.ObjectId();
            const res = await apiRequest(
                "POST",
                `/api/campaigns/${fakeId}/applications`,
                { pitch: "Valid pitch text for testing non-existent campaign." },
                creator1Token
            );
            record("Apply to non-existent campaign returns 404", res.status === 404, `Status: ${res.status}`);
        }

        // Test 4: Application to draft campaign returns 400
        {
            const res = await apiRequest(
                "POST",
                `/api/campaigns/${draftCampaign._id}/applications`,
                { pitch: "I want to apply to this draft campaign please." },
                creator1Token
            );
            record("Apply to draft campaign returns 400", res.status === 400, `Status: ${res.status}`);
        }

        // Test 5: Missing or empty pitch returns 400
        {
            const res = await apiRequest(
                "POST",
                `/api/campaigns/${publishedCampaign._id}/applications`,
                { pitch: "   " },
                creator1Token
            );
            record("Empty pitch returns 400", res.status === 400, `Status: ${res.status}`);
        }

        // Test 6: Pitch less than 10 characters returns 400
        {
            const res = await apiRequest(
                "POST",
                `/api/campaigns/${publishedCampaign._id}/applications`,
                { pitch: "Short" },
                creator1Token
            );
            record("Pitch under 10 chars returns 400", res.status === 400, `Status: ${res.status}`);
        }

        // Test 7: Negative proposedBudget returns 400
        {
            const res = await apiRequest(
                "POST",
                `/api/campaigns/${publishedCampaign._id}/applications`,
                { pitch: "Valid pitch explaining my reach and past reviews.", proposedBudget: -200 },
                creator1Token
            );
            record("Negative proposedBudget returns 400", res.status === 400, `Status: ${res.status}`);
        }

        // Test 8: Valid application creation succeeds (201)
        let app1Id = null;
        {
            const res = await apiRequest(
                "POST",
                `/api/campaigns/${publishedCampaign._id}/applications`,
                {
                    pitch: "I have 50k subscribers in the mechanical keyboard space. I'd love to produce a 60-second dedicated review.",
                    proposedBudget: 1800,
                },
                creator1Token
            );
            const passed = res.status === 201 && res.body?.application?.status === "pending";
            app1Id = res.body?.application?._id;
            record("Creator 1 applies successfully (201, pending)", passed, `Status: ${res.status}`);
        }

        // Test 9: Duplicate application by same creator returns 400
        {
            const res = await apiRequest(
                "POST",
                `/api/campaigns/${publishedCampaign._id}/applications`,
                {
                    pitch: "Trying to apply again with a different pitch message.",
                    proposedBudget: 2000,
                },
                creator1Token
            );
            record("Duplicate application to same campaign returns 400", res.status === 400, `Status: ${res.status}`);
        }

        console.log("\n--- 3. STATUS CHECKS & QUERIES ---");
        // Test 10: Check my application status (Creator 1 has applied)
        {
            const res = await apiRequest(
                "GET",
                `/api/campaigns/${publishedCampaign._id}/my-application`,
                null,
                creator1Token
            );
            const passed = res.status === 200 && res.body?.hasApplied === true && res.body?.application?._id === app1Id;
            record("Check my-application returns hasApplied=true", passed, `Status: ${res.status}`);
        }

        // Test 11: Check my application status (Creator 2 has NOT applied)
        {
            const res = await apiRequest(
                "GET",
                `/api/campaigns/${publishedCampaign._id}/my-application`,
                null,
                creator2Token
            );
            const passed = res.status === 200 && res.body?.hasApplied === false && res.body?.application === null;
            record("Check my-application returns hasApplied=false for non-applicant", passed, `Status: ${res.status}`);
        }

        // Test 12: Creator 1 gets their list of applications (/api/applications/mine)
        {
            const res = await apiRequest("GET", "/api/applications/mine", null, creator1Token);
            const passed = res.status === 200 && res.body?.applications?.length === 1 && res.body?.applications[0]?.campaign?.title;
            record("Creator 1 retrieves their applications with populated campaign", passed, `Count: ${res.body?.applications?.length}`);
        }

        // Test 13: Creator 1 views single application by ID
        {
            const res = await apiRequest("GET", `/api/applications/${app1Id}`, null, creator1Token);
            const passed = res.status === 200 && res.body?.application?._id === app1Id;
            record("Creator 1 views application by ID", passed, `Status: ${res.status}`);
        }

        // Test 14: Unauthorized creator cannot view Creator 1's application
        {
            const res = await apiRequest("GET", `/api/applications/${app1Id}`, null, creator2Token);
            record("Unauthorized creator cannot view application (403)", res.status === 403, `Status: ${res.status}`);
        }

        console.log("\n--- 4. BRAND REVIEW & CAMPAIGN APPLICATIONS ---");
        // Test 15: Brand 1 (owner) views applications for their campaign
        {
            const res = await apiRequest("GET", `/api/campaigns/${publishedCampaign._id}/applications`, null, brand1Token);
            const passed = res.status === 200 && res.body?.applications?.length === 1 && res.body?.applications[0]?.creator?.name;
            record("Brand 1 views campaign applications with populated creator profile", passed, `Count: ${res.body?.applications?.length}`);
        }

        // Test 16: Other brand cannot view applications for Brand 1's campaign (403)
        {
            const res = await apiRequest("GET", `/api/campaigns/${publishedCampaign._id}/applications`, null, brand2Token);
            record("Unrelated brand cannot view applications (403)", res.status === 403, `Status: ${res.status}`);
        }

        console.log("\n--- 5. APPLICATION WITHDRAWAL WORKFLOW ---");
        // Test 17: Creator 2 applies to the campaign
        let app2Id = null;
        {
            const res = await apiRequest(
                "POST",
                `/api/campaigns/${publishedCampaign._id}/applications`,
                {
                    pitch: "I create keyboard typing ASMR and software tutorials. Will feature this in my desk tour video.",
                    proposedBudget: 1500,
                },
                creator2Token
            );
            const passed = res.status === 201 && res.body?.application?.status === "pending";
            app2Id = res.body?.application?._id;
            record("Creator 2 applies to campaign (201, pending)", passed, `Status: ${res.status}`);
        }

        // Test 18: Creator 2 withdraws application
        {
            const res = await apiRequest("PATCH", `/api/applications/${app2Id}/withdraw`, null, creator2Token);
            const passed = res.status === 200 && res.body?.application?.status === "withdrawn";
            record("Creator 2 withdraws pending application", passed, `Status: ${res.status}`);
        }

        // Test 19: Cannot withdraw already withdrawn application (400)
        {
            const res = await apiRequest("PATCH", `/api/applications/${app2Id}/withdraw`, null, creator2Token);
            record("Cannot withdraw already withdrawn application (400)", res.status === 400, `Status: ${res.status}`);
        }

        // Test 20: Brand cannot accept a withdrawn application (400)
        {
            const res = await apiRequest("PATCH", `/api/applications/${app2Id}/accept`, null, brand1Token);
            record("Brand cannot accept withdrawn application (400)", res.status === 400, `Status: ${res.status}`);
        }

        console.log("\n--- 6. ACCEPTANCE LIFECYCLE & COLLABORATION CREATION ---");
        // Test 21: Brand 1 accepts Creator 1's application -> Collaboration created
        let collab1Id = null;
        {
            const res = await apiRequest("PATCH", `/api/applications/${app1Id}/accept`, null, brand1Token);
            const passed =
                res.status === 200 &&
                res.body?.application?.status === "accepted" &&
                res.body?.collaboration?.status === "active";
            collab1Id = res.body?.collaboration?._id;
            record("Brand 1 accepts Creator 1 -> Application accepted, Collaboration active", passed, `Status: ${res.status}`);
        }

        // Test 22: Cannot re-accept an already accepted application (400)
        {
            const res = await apiRequest("PATCH", `/api/applications/${app1Id}/accept`, null, brand1Token);
            record("Cannot re-accept already accepted application (400)", res.status === 400, `Status: ${res.status}`);
        }

        // Test 23: Cannot withdraw an accepted application (400)
        {
            const res = await apiRequest("PATCH", `/api/applications/${app1Id}/withdraw`, null, creator1Token);
            record("Creator cannot withdraw accepted application (400)", res.status === 400, `Status: ${res.status}`);
        }

        console.log("\n--- 7. REJECTION LIFECYCLE ---");
        // Test 24: Creator 3 applies, Brand 1 rejects
        let app3Id = null;
        {
            const applyRes = await apiRequest(
                "POST",
                `/api/campaigns/${publishedCampaign._id}/applications`,
                {
                    pitch: "I do budget build reviews and want to include this board.",
                    proposedBudget: 900,
                },
                creator3Token
            );
            app3Id = applyRes.body?.application?._id;

            const rejectRes = await apiRequest("PATCH", `/api/applications/${app3Id}/reject`, null, brand1Token);
            const passed = rejectRes.status === 200 && rejectRes.body?.application?.status === "rejected";
            record("Brand 1 rejects Creator 3 application", passed, `Status: ${rejectRes.status}`);
        }

        // Test 25: Cannot accept a rejected application (400)
        {
            const res = await apiRequest("PATCH", `/api/applications/${app3Id}/accept`, null, brand1Token);
            record("Cannot accept rejected application (400)", res.status === 400, `Status: ${res.status}`);
        }

        console.log("\n--- 8. COLLABORATION MANAGEMENT & PERMISSIONS ---");
        // Test 26: Creator 1 views their collaborations via /api/collaborations/mine
        {
            const res = await apiRequest("GET", "/api/collaborations/mine", null, creator1Token);
            const passed =
                res.status === 200 &&
                res.body?.collaborations?.length === 1 &&
                res.body?.collaborations[0]?.campaign?.title &&
                res.body?.collaborations[0]?.isConnectedWithPartner === false;
            record("Creator 1 retrieves collaborations (with isConnectedWithPartner=false)", passed, `Count: ${res.body?.collaborations?.length}`);
        }

        // Test 27: Brand 1 views their collaborations via /api/collaborations/mine
        {
            const res = await apiRequest("GET", "/api/collaborations/mine", null, brand1Token);
            const passed =
                res.status === 200 &&
                res.body?.collaborations?.length === 1 &&
                res.body?.collaborations[0]?.creator?.name === "Phase3B Tech Creator 1";
            record("Brand 1 retrieves collaborations with populated creator", passed, `Count: ${res.body?.collaborations?.length}`);
        }

        // Test 28: Get collaboration by ID (authorized creator)
        {
            const res = await apiRequest("GET", `/api/collaborations/${collab1Id}`, null, creator1Token);
            const passed = res.status === 200 && res.body?.collaboration?._id === collab1Id;
            record("Creator 1 gets collaboration by ID", passed, `Status: ${res.status}`);
        }

        // Test 29: Unauthorized user cannot get collaboration by ID (403)
        {
            const res = await apiRequest("GET", `/api/collaborations/${collab1Id}`, null, creator2Token);
            record("Unauthorized user gets 403 on collaboration by ID", res.status === 403, `Status: ${res.status}`);
        }

        // Test 30: Messaging security & connection integration check:
        // Once Brand 1 and Creator 1 have an accepted Connection, isConnectedWithPartner becomes true!
        {
            await Connection.create({
                senderId: brand1._id,
                receiverId: creator1._id,
                status: "accepted",
            });

            const res = await apiRequest("GET", `/api/collaborations/${collab1Id}`, null, creator1Token);
            const passed = res.status === 200 && res.body?.collaboration?.isConnectedWithPartner === true;
            record("Collaboration accurately reflects accepted connection (isConnectedWithPartner=true)", passed, `Status: ${res.status}`);
        }

        // Summary
        console.log("\n==========================================");
        const passedCount = results.filter(r => r.passed).length;
        const totalCount = results.length;
        console.log(`TOTAL TESTS: ${totalCount} | PASSED: ${passedCount} | FAILED: ${totalCount - passedCount}`);
        console.log("==========================================");

        server.close();
        await mongoose.disconnect();
        return passedCount === totalCount;
    } catch (err) {
        console.error("Test execution error:", err);
        server.close();
        await mongoose.disconnect();
        return false;
    }
}

runPhase3BTests().then((allPassed) => {
    process.exit(allPassed ? 0 : 1);
});
