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

async function runPhase4CTests() {
    console.log("==========================================");
    console.log("   ORBIT PHASE 4C E2E VALIDATION SUITE    ");
    console.log("==========================================");

    let connectedTo = "";
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: "Orbit", serverSelectionTimeoutMS: 5000 });
        connectedTo = "MongoDB Atlas Live Cluster";
    } catch (err) {
        console.log("Atlas connection timed out. Falling back to local MongoDB on 127.0.0.1:27017...");
        await mongoose.connect("mongodb://127.0.0.1:27017/Orbit_Phase4C_Test", { serverSelectionTimeoutMS: 5000 });
        connectedTo = "Local MongoDB (127.0.0.1:27017/Orbit_Phase4C_Test)";
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

    async function cleanup(userIds) {
        if (!userIds || !userIds.length) return;
        await Promise.all([
            User.deleteMany({ _id: { $in: userIds } }),
            CreatorProfile.deleteMany({ userId: { $in: userIds } }),
            BrandProfile.deleteMany({ userId: { $in: userIds } }),
            Campaign.deleteMany({ brandId: { $in: userIds } }),
            Application.deleteMany({ creatorId: { $in: userIds } }),
            Collaboration.deleteMany({ $or: [{ brandId: { $in: userIds } }, { creatorId: { $in: userIds } }] }),
            Connection.deleteMany({ $or: [{ senderId: { $in: userIds } }, { receiverId: { $in: userIds } }] }),
        ]);
    }

    let createdUserIds = [];

    try {
        // Initial cleanup of any stale phase4c test users
        const staleUsers = await User.find({ email: { $regex: /^phase4c_test_/ } });
        if (staleUsers.length) {
            await cleanup(staleUsers.map(u => u._id));
        }

        const now = Date.now();

        // 1. Create Brand 1 (Collaboration Owner)
        const brand1 = await User.create({
            name: "Phase4C Nexus Brand",
            fullName: "Phase4C Nexus Brand",
            companyName: "Nexus Brand",
            email: `phase4c_test_brand1_${now}@example.com`,
            password: "hashedpassword123",
            role: "brand",
            onBoardingCompleted: true,
        });
        await BrandProfile.create({
            userId: brand1._id,
            companyName: "Nexus Brand",
            industry: "Technology",
            location: "San Francisco, CA",
        });
        const brand1Token = generateToken(brand1);

        // 2. Create Brand 2 (Unrelated Brand)
        const brand2 = await User.create({
            name: "Phase4C Other Brand",
            fullName: "Phase4C Other Brand",
            companyName: "Other Brand",
            email: `phase4c_test_brand2_${now}@example.com`,
            password: "hashedpassword123",
            role: "brand",
            onBoardingCompleted: true,
        });
        await BrandProfile.create({
            userId: brand2._id,
            companyName: "Other Brand",
            industry: "Fashion",
            location: "New York, NY",
        });
        const brand2Token = generateToken(brand2);

        // 3. Create Creator 1 (Assigned Creator)
        const creator1 = await User.create({
            name: "Phase4C Tech Creator",
            fullName: "Phase4C Tech Creator",
            email: `phase4c_test_creator1_${now}@example.com`,
            password: "hashedpassword123",
            role: "creator",
            onBoardingCompleted: true,
        });
        await CreatorProfile.create({
            userId: creator1._id,
            bio: "Tech reviewer",
            primaryPlatform: "YouTube",
            portfolio: [],
        });
        const creator1Token = generateToken(creator1);

        // 4. Create Creator 2 (Unrelated Creator)
        const creator2 = await User.create({
            name: "Phase4C Other Creator",
            fullName: "Phase4C Other Creator",
            email: `phase4c_test_creator2_${now}@example.com`,
            password: "hashedpassword123",
            role: "creator",
            onBoardingCompleted: true,
        });
        await CreatorProfile.create({
            userId: creator2._id,
            bio: "Travel vlogger",
            primaryPlatform: "Instagram",
            portfolio: [],
        });
        const creator2Token = generateToken(creator2);

        createdUserIds = [brand1._id, brand2._id, creator1._id, creator2._id];

        // 5. Create Campaign owned by Brand 1 with initial deliverable strings
        const campaign1 = await Campaign.create({
            brandId: brand1._id,
            title: "Phase4C Quantum X Launch",
            description: "Showcase the new Quantum X hardware.",
            category: "Technology",
            budget: 4500,
            status: "published",
            deliverables: ["1x 60-second YouTube Short", "1x Dedicated Video Review"],
            startDate: new Date(),
            endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });

        // 6. Create Application from Creator 1 to Campaign 1
        const app1 = await Application.create({
            campaignId: campaign1._id,
            creatorId: creator1._id,
            pitch: "I love tech gear and have 100k subscribers.",
            proposedRate: 4500,
            status: "accepted",
        });

        // 7. Seed collaboration through the accepted application flow / direct creation
        // Simulating the application acceptance which seeds deliverables from campaign
        const initialDeliverables = campaign1.deliverables.map(d => ({
            title: d,
            description: `Deliverable requirement from campaign: ${campaign1.title}`,
            status: "pending",
        }));

        const collab1 = await Collaboration.create({
            campaignId: campaign1._id,
            applicationId: app1._id,
            brandId: brand1._id,
            creatorId: creator1._id,
            status: "active",
            deliverables: initialDeliverables,
        });
        const collab1Id = collab1._id.toString();

        console.log(`\nTest setup ready. Collab ID: ${collab1Id}`);

        // --- TEST 1: Collaboration participant (Creator 1) can access workspace ---
        {
            const res = await apiRequest("GET", `/api/collaborations/${collab1Id}`, null, creator1Token);
            const passed = res.status === 200 &&
                res.body?.collaboration?._id?.toString() === collab1Id &&
                res.body?.collaboration?.deliverables?.length === 2 &&
                res.body?.collaboration?.progress?.total === 2 &&
                res.body?.collaboration?.progress?.completionPercentage === 0;
            if (!passed) console.log("Test 1 debug:", JSON.stringify(res.body));
            record("Test 1: Collaboration participant (Creator 1) can access workspace", passed, `Status: ${res.status}`);
        }

        // --- TEST 1B: Collaboration participant (Brand 1) can access workspace ---
        {
            const res = await apiRequest("GET", `/api/collaborations/${collab1Id}`, null, brand1Token);
            const passed = res.status === 200 && res.body?.collaboration?._id?.toString() === collab1Id;
            record("Test 1b: Collaboration participant (Brand 1) can access workspace", passed, `Status: ${res.status}`);
        }

        // --- TEST 2: Unrelated creator (Creator 2) cannot access workspace (403) ---
        {
            const res = await apiRequest("GET", `/api/collaborations/${collab1Id}`, null, creator2Token);
            const passed = res.status === 403;
            record("Test 2: Unrelated creator cannot access workspace (403)", passed, `Status: ${res.status}`);
        }

        // --- TEST 3: Unrelated brand (Brand 2) cannot access workspace (403) ---
        {
            const res = await apiRequest("GET", `/api/collaborations/${collab1Id}`, null, brand2Token);
            const passed = res.status === 403;
            record("Test 3: Unrelated brand cannot access workspace (403)", passed, `Status: ${res.status}`);
        }

        // --- TEST 4: Brand can configure/add deliverables for its own collaboration ---
        let addedDeliverableId = null;
        {
            const res = await apiRequest("POST", `/api/collaborations/${collab1Id}/deliverables`, {
                title: "1x High-Res Unboxing Photo Set",
                description: "Deliver at least 5 raw photo assets.",
                dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            }, brand1Token);
            const passed = res.status === 201 &&
                res.body?.deliverables?.length === 3 &&
                res.body?.progress?.total === 3;
            if (res.body?.deliverable?._id) {
                addedDeliverableId = res.body.deliverable._id.toString();
            }
            record("Test 4: Brand can configure/add deliverables for its own collaboration", passed, `Status: ${res.status}`);
        }

        // --- TEST 5: Another brand cannot configure those deliverables (403) ---
        {
            const res = await apiRequest("POST", `/api/collaborations/${collab1Id}/deliverables`, {
                title: "Malicious Deliverable",
                description: "Should be forbidden",
            }, brand2Token);
            const passed = res.status === 403;
            record("Test 5: Another brand cannot configure deliverables (403)", passed, `Status: ${res.status}`);
        }

        // --- TEST 5B: Creator cannot add deliverables (403) ---
        {
            const res = await apiRequest("POST", `/api/collaborations/${collab1Id}/deliverables`, {
                title: "Creator Added Deliverable",
                description: "Creators cannot add deliverables",
            }, creator1Token);
            const passed = res.status === 403;
            record("Test 5b: Creator cannot add deliverables (403)", passed, `Status: ${res.status}`);
        }

        // --- TEST 6: Creator can submit their own deliverable ---
        let firstDeliverableId = collab1.deliverables[0]._id.toString();
        {
            const res = await apiRequest("POST", `/api/collaborations/${collab1Id}/deliverables/${firstDeliverableId}/submit`, {
                submissionUrl: "https://youtube.com/shorts/test12345",
                submissionNotes: "Here is the YouTube Short link for review!",
            }, creator1Token);
            const d = res.body?.deliverable;
            const passed = res.status === 200 &&
                d?.status === "submitted" &&
                d?.submissionUrl === "https://youtube.com/shorts/test12345" &&
                res.body?.progress?.submitted === 1;
            record("Test 6: Creator can submit their own deliverable", passed, `Status: ${res.status}`);
        }

        // --- TEST 7: Another creator cannot submit work for that collaboration (403) ---
        let secondDeliverableId = collab1.deliverables[1]._id.toString();
        {
            const res = await apiRequest("POST", `/api/collaborations/${collab1Id}/deliverables/${secondDeliverableId}/submit`, {
                submissionUrl: "https://youtube.com/watch?v=unauthorized",
            }, creator2Token);
            const passed = res.status === 403;
            record("Test 7: Another creator cannot submit work for that collaboration (403)", passed, `Status: ${res.status}`);
        }

        // --- TEST 8: Creator cannot approve their own submission (403) ---
        {
            const res = await apiRequest("POST", `/api/collaborations/${collab1Id}/deliverables/${firstDeliverableId}/approve`, {}, creator1Token);
            const passed = res.status === 403;
            record("Test 8: Creator cannot approve their own submission (403)", passed, `Status: ${res.status}`);
        }

        // --- TEST 9: Brand can approve a valid submission ---
        {
            const res = await apiRequest("POST", `/api/collaborations/${collab1Id}/deliverables/${firstDeliverableId}/approve`, {}, brand1Token);
            const d = res.body?.deliverable;
            const passed = res.status === 200 &&
                d?.status === "approved" &&
                Boolean(d?.approvedAt) &&
                res.body?.progress?.approved === 1 &&
                res.body?.progress?.completionPercentage === 33;
            record("Test 9: Brand can approve a valid submission", passed, `Status: ${res.status}`);
        }

        // --- TEST 10: Brand can request revisions with a feedback message ---
        // First submit second deliverable as creator
        await apiRequest("POST", `/api/collaborations/${collab1Id}/deliverables/${secondDeliverableId}/submit`, {
            submissionUrl: "https://youtube.com/watch?v=draft1",
            submissionNotes: "First cut of the dedicated review.",
        }, creator1Token);

        {
            const res = await apiRequest("POST", `/api/collaborations/${collab1Id}/deliverables/${secondDeliverableId}/revision`, {
                feedback: "Please increase the volume of the voiceover and add product link in description.",
            }, brand1Token);
            const d = res.body?.deliverable;
            const passed = res.status === 200 &&
                d?.status === "revision_requested" &&
                d?.revisionFeedback === "Please increase the volume of the voiceover and add product link in description." &&
                res.body?.progress?.revisionRequested === 1;
            record("Test 10: Brand can request revisions with a feedback message", passed, `Status: ${res.status}`);
        }

        // --- TEST 11: Revision feedback is required (empty feedback rejected with 400) ---
        // Submit addedDeliverableId as creator first
        await apiRequest("POST", `/api/collaborations/${collab1Id}/deliverables/${addedDeliverableId}/submit`, {
            submissionUrl: "https://photos.google.com/album/unboxing",
        }, creator1Token);

        {
            const res = await apiRequest("POST", `/api/collaborations/${collab1Id}/deliverables/${addedDeliverableId}/revision`, {
                feedback: "   ",
            }, brand1Token);
            const passed = res.status === 400 && res.body?.message?.toLowerCase().includes("feedback");
            record("Test 11: Revision feedback is required (empty feedback rejected 400)", passed, `Status: ${res.status}`);
        }

        // --- TEST 12: Creator can resubmit after revisions ---
        {
            const res = await apiRequest("POST", `/api/collaborations/${collab1Id}/deliverables/${secondDeliverableId}/submit`, {
                submissionUrl: "https://youtube.com/watch?v=draft2_revised",
                submissionNotes: "Fixed audio balance and updated video description link.",
            }, creator1Token);
            const d = res.body?.deliverable;
            const passed = res.status === 200 &&
                d?.status === "submitted" &&
                d?.submissionUrl === "https://youtube.com/watch?v=draft2_revised";
            record("Test 12: Creator can resubmit after revisions", passed, `Status: ${res.status}`);
        }

        // --- TEST 13: Invalid status transitions are rejected ---
        // 13a. Cannot approve an already approved deliverable (firstDeliverableId is already approved)
        {
            const res = await apiRequest("POST", `/api/collaborations/${collab1Id}/deliverables/${firstDeliverableId}/approve`, {}, brand1Token);
            const passed = res.status === 400;
            record("Test 13a: Cannot approve already approved deliverable (400)", passed, `Status: ${res.status}`);
        }
        // 13b. Cannot request revisions on an approved deliverable
        {
            const res = await apiRequest("POST", `/api/collaborations/${collab1Id}/deliverables/${firstDeliverableId}/revision`, {
                feedback: "Change after approval",
            }, brand1Token);
            const passed = res.status === 400;
            record("Test 13b: Cannot request revisions on approved deliverable (400)", passed, `Status: ${res.status}`);
        }
        // 13c. Cannot submit an approved deliverable
        {
            const res = await apiRequest("POST", `/api/collaborations/${collab1Id}/deliverables/${firstDeliverableId}/submit`, {
                submissionUrl: "https://youtube.com/newlink",
            }, creator1Token);
            const passed = res.status === 400;
            record("Test 13c: Cannot submit an approved deliverable (400)", passed, `Status: ${res.status}`);
        }

        // --- TEST 14: Completed/cancelled collaborations reject disallowed submissions ---
        {
            const cancelledApp = await Application.create({
                campaignId: campaign1._id,
                creatorId: creator2._id,
                pitch: "Cancelled test application",
                proposedRate: 2000,
                status: "accepted",
            });

            const cancelledCollab = await Collaboration.create({
                campaignId: campaign1._id,
                applicationId: cancelledApp._id,
                brandId: brand1._id,
                creatorId: creator2._id,
                status: "cancelled",
                deliverables: [{
                    title: "Cancelled deliverable",
                    description: "No work should be accepted",
                    status: "pending",
                }],
            });
            const cancelledDeliverableId = cancelledCollab.deliverables[0]._id.toString();

            const res = await apiRequest("POST", `/api/collaborations/${cancelledCollab._id}/deliverables/${cancelledDeliverableId}/submit`, {
                submissionUrl: "https://example.com/asset",
            }, creator2Token);
            const passed = res.status === 400 && (res.body?.message?.toLowerCase().includes("cancelled") || res.body?.message?.toLowerCase().includes("active"));
            record("Test 14: Cancelled collaboration rejects submissions (400)", passed, `Status: ${res.status}`);
        }

        // --- TEST 15: Invalid ObjectIds and malformed inputs are rejected ---
        {
            // Invalid collaboration ObjectId
            const res1 = await apiRequest("GET", `/api/collaborations/invalidObjectId123`, null, creator1Token);
            // Invalid deliverable ObjectId
            const res2 = await apiRequest("POST", `/api/collaborations/${collab1Id}/deliverables/notAValidId/submit`, {
                submissionUrl: "https://example.com",
            }, creator1Token);
            // Missing title when adding deliverable
            const res3 = await apiRequest("POST", `/api/collaborations/${collab1Id}/deliverables`, {
                description: "Missing title",
            }, brand1Token);
            // Missing submissionUrl when submitting
            const res4 = await apiRequest("POST", `/api/collaborations/${collab1Id}/deliverables/${addedDeliverableId}/submit`, {
                submissionUrl: "   ",
            }, creator1Token);

            const passed = res1.status === 400 && res2.status === 400 && res3.status === 400 && res4.status === 400;
            record("Test 15: Invalid ObjectIds and malformed inputs rejected (400)", passed, `Statuses: ${res1.status}, ${res2.status}, ${res3.status}, ${res4.status}`);
        }

        // --- TEST 16: Derived overdue indicator and progress tracking accuracy ---
        {
            const overdueCampaign = await Campaign.create({
                brandId: brand1._id,
                title: "Overdue Test Campaign",
                description: "Testing overdue",
                category: "Technology",
                budget: 500,
                status: "published",
            });
            const overdueApp = await Application.create({
                campaignId: overdueCampaign._id,
                creatorId: creator1._id,
                pitch: "Overdue test application",
                proposedRate: 500,
                status: "accepted",
            });

            // Create a deliverable with a past due date
            const overdueCollab = await Collaboration.create({
                campaignId: overdueCampaign._id,
                applicationId: overdueApp._id,
                brandId: brand1._id,
                creatorId: creator1._id,
                status: "active",
                deliverables: [
                    {
                        title: "Past Due Deliverable",
                        description: "Should have isOverdue = true",
                        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                        status: "pending",
                    },
                    {
                        title: "Approved Past Due Deliverable",
                        description: "Approved deliverables are never overdue",
                        dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                        status: "approved",
                        approvedAt: new Date(),
                    }
                ],
            });

            const res = await apiRequest("GET", `/api/collaborations/${overdueCollab._id}`, null, brand1Token);
            const delivs = res.body?.collaboration?.deliverables || [];
            const progress = res.body?.collaboration?.progress || {};

            const firstIsOverdue = delivs[0]?.isOverdue === true;
            const secondNotOverdue = delivs[1]?.isOverdue === false;
            const overdueCountCorrect = progress.overdue === 1;
            const completionPercentageCorrect = progress.completionPercentage === 50;

            const passed = res.status === 200 && firstIsOverdue && secondNotOverdue && overdueCountCorrect && completionPercentageCorrect;
            record("Test 16: Derived overdue indicator and progress statistics computed accurately", passed, `Overdue count: ${progress.overdue}, completion: ${progress.completionPercentage}%`);
        }

        // --- TEST 17: Existing Application Acceptance seeds Deliverables ---
        {
            // Verify application acceptance logic by calling accept on a new application
            const campaignWithDelivs = await Campaign.create({
                brandId: brand1._id,
                title: "Seeding Test Campaign",
                description: "Test seeding",
                category: "Technology",
                budget: 1000,
                status: "published",
                deliverables: ["Deliverable Seed 1", "Deliverable Seed 2"],
            });
            const appToAccept = await Application.create({
                campaignId: campaignWithDelivs._id,
                creatorId: creator1._id,
                pitch: "I can deliver quickly",
                proposedRate: 1000,
                status: "pending",
            });

            const res = await apiRequest("PATCH", `/api/applications/${appToAccept._id}/accept`, {}, brand1Token);

            const createdCollab = await Collaboration.findOne({ applicationId: appToAccept._id });
            const passed = res.status === 200 &&
                createdCollab &&
                createdCollab.deliverables.length === 2 &&
                createdCollab.deliverables[0].title === "Deliverable Seed 1" &&
                createdCollab.deliverables[1].title === "Deliverable Seed 2";
            record("Test 17: Accepting application automatically seeds campaign deliverables into Collaboration", passed, `Count: ${createdCollab?.deliverables?.length}`);
        }

        // Summary
        console.log("\n==========================================");
        const passedCount = results.filter(r => r.passed).length;
        const totalCount = results.length;
        console.log(`TOTAL TESTS: ${totalCount} | PASSED: ${passedCount} | FAILED: ${totalCount - passedCount}`);
        console.log("==========================================");

        // Cleanup
        await cleanup(createdUserIds);
        console.log("Cleaned up all test records.");

        server.close();
        await mongoose.disconnect();
        return passedCount === totalCount;
    } catch (err) {
        console.error("Test execution error:", err);
        if (createdUserIds.length) {
            await cleanup(createdUserIds);
        }
        server.close();
        await mongoose.disconnect();
        return false;
    }
}

runPhase4CTests().then((allPassed) => {
    process.exit(allPassed ? 0 : 1);
});
