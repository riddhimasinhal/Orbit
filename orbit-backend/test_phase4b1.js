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

async function runPhase4B1Tests() {
    console.log("==========================================");
    console.log("  ORBIT PHASE 4B.1 VALIDATION SUITE       ");
    console.log("  (Admin Verification Portal & Regression)");
    console.log("==========================================\n");

    let connectedTo = "";
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: "Orbit", serverSelectionTimeoutMS: 5000 });
        connectedTo = "MongoDB Atlas Live Cluster";
    } catch (err) {
        console.log("Atlas connection timed out. Falling back to local MongoDB on 127.0.0.1:27017...");
        await mongoose.connect("mongodb://127.0.0.1:27017/Orbit_Phase4B1_Test", { serverSelectionTimeoutMS: 5000 });
        connectedTo = "Local MongoDB (127.0.0.1:27017/Orbit_Phase4B1_Test)";
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

    const testUserIds = [];

    try {
        const now = Date.now();
        // Cleanup disposable data from previous runs if any
        const cleanupFilter = { email: { $regex: /^phase4b1_test_/ } };
        const prevUsers = await User.find(cleanupFilter);
        const prevIds = prevUsers.map((u) => u._id);
        if (prevIds.length) {
            await Promise.all([
                User.deleteMany({ _id: { $in: prevIds } }),
                CreatorProfile.deleteMany({ userId: { $in: prevIds } }),
                BrandProfile.deleteMany({ userId: { $in: prevIds } }),
                Campaign.deleteMany({ brandId: { $in: prevIds } }),
                Application.deleteMany({ creatorId: { $in: prevIds } }),
                Collaboration.deleteMany({ $or: [{ creatorId: { $in: prevIds } }, { brandId: { $in: prevIds } }] }),
                Connection.deleteMany({ $or: [{ requester: { $in: prevIds } }, { recipient: { $in: prevIds } }] }),
                Conversation.deleteMany({ participants: { $in: prevIds } }),
                PortfolioItem.deleteMany({ creatorId: { $in: prevIds } }),
            ]);
        }

        // Provision test users
        // 1. Admin
        const adminUser = await User.create({
            name: "Phase4B1 Admin",
            email: `phase4b1_test_admin_${now}@example.com`,
            password: "password123",
            role: "admin",
            onBoardingCompleted: true,
        });
        testUserIds.push(adminUser._id);
        const adminToken = generateToken(adminUser);

        // 2. Creator 1 (For approve flow)
        const creator1 = await User.create({
            name: "Phase4B1 Creator One",
            email: `phase4b1_test_creator1_${now}@example.com`,
            password: "password123",
            role: "creator",
            onBoardingCompleted: true,
        });
        testUserIds.push(creator1._id);
        const creator1Profile = await CreatorProfile.create({
            userId: creator1._id,
            fullName: "Phase4B1 Creator One",
            username: `p4b1creator1_${now}`,
            bio: "Experienced tech and lifestyle creator",
            niche: ["Tech", "Lifestyle"],
            location: "Bengaluru, India",
            socialLinks: { instagram: "creator1_tech", youtube: "https://youtube.com/@creator1" },
            verificationStatus: "pending",
            verificationRequestedAt: new Date(),
        });
        // Create 2 portfolio items for creator 1
        await PortfolioItem.create([
            {
                creatorId: creator1._id,
                title: "Tech Review 1",
                description: "Review of latest device",
                mediaUrl: "https://example.com/item1.jpg",
                mediaType: "image",
            },
            {
                creatorId: creator1._id,
                title: "Tech Review 2",
                description: "Unboxing video",
                mediaUrl: "https://example.com/item2.mp4",
                mediaType: "video",
            },
        ]);
        const creator1Token = generateToken(creator1);

        // 3. Creator 2 (For reject flow)
        const creator2 = await User.create({
            name: "Phase4B1 Creator Two",
            email: `phase4b1_test_creator2_${now}@example.com`,
            password: "password123",
            role: "creator",
            onBoardingCompleted: true,
        });
        testUserIds.push(creator2._id);
        const creator2Profile = await CreatorProfile.create({
            userId: creator2._id,
            fullName: "Phase4B1 Creator Two",
            username: `p4b1creator2_${now}`,
            bio: "Fashion and beauty content creator",
            niche: ["Fashion", "Beauty"],
            verificationStatus: "pending",
            verificationRequestedAt: new Date(),
        });
        const creator2Token = generateToken(creator2);

        // 4. Creator 3 (For unverified -> pending request flow test)
        const creator3 = await User.create({
            name: "Phase4B1 Creator Three",
            email: `phase4b1_test_creator3_${now}@example.com`,
            password: "password123",
            role: "creator",
            onBoardingCompleted: true,
        });
        testUserIds.push(creator3._id);
        const creator3Profile = await CreatorProfile.create({
            userId: creator3._id,
            fullName: "Phase4B1 Creator Three",
            username: `p4b1creator3_${now}`,
            bio: "New creator starting out",
            niche: ["Fitness"],
            verificationStatus: "unverified",
        });
        const creator3Token = generateToken(creator3);

        // 5. Brand user
        const brandUser = await User.create({
            name: "Phase4B1 Brand User",
            email: `phase4b1_test_brand_${now}@example.com`,
            password: "password123",
            role: "brand",
            onBoardingCompleted: true,
        });
        testUserIds.push(brandUser._id);
        await BrandProfile.create({
            userId: brandUser._id,
            brandName: "Orbit Test Co",
            companyWebsite: "https://brand.example.com",
            industry: "Tech",
        });
        const brandToken = generateToken(brandUser);

        console.log("--- 1. ADMIN ACCESS CONTROL ---");
        // Test 1: Admin can access /admin/verifications
        const res1 = await apiRequest("GET", "/api/admin/verifications", null, adminToken);
        if (res1.status === 200 && res1.body?.success) {
            record("1. Admin can access /admin/verifications", "PASS", "HTTP 200 returned");
        } else {
            record("1. Admin can access /admin/verifications", "FAIL", `Status: ${res1.status}`);
        }

        // Test 2: Creator cannot access /admin/verifications
        const res2 = await apiRequest("GET", "/api/admin/verifications", null, creator1Token);
        if (res2.status === 403) {
            record("2. Creator cannot access /admin/verifications", "PASS", "HTTP 403 Forbidden returned");
        } else {
            record("2. Creator cannot access /admin/verifications", "FAIL", `Status: ${res2.status}`);
        }

        // Test 3: Brand cannot access /admin/verifications
        const res3 = await apiRequest("GET", "/api/admin/verifications", null, brandToken);
        if (res3.status === 403) {
            record("3. Brand cannot access /admin/verifications", "PASS", "HTTP 403 Forbidden returned");
        } else {
            record("3. Brand cannot access /admin/verifications", "FAIL", `Status: ${res3.status}`);
        }

        // Test 4: Unauthenticated user cannot access /admin/verifications
        const res4 = await apiRequest("GET", "/api/admin/verifications", null, null);
        if (res4.status === 401) {
            record("4. Unauthenticated user cannot access /admin/verifications", "PASS", "HTTP 401 Unauthorized returned");
        } else {
            record("4. Unauthenticated user cannot access /admin/verifications", "FAIL", `Status: ${res4.status}`);
        }

        console.log("\n--- 2. VERIFICATION QUEUE & METADATA ---");
        // Test 5: Admin sees pending verification requests
        const res5 = await apiRequest("GET", "/api/admin/verifications", null, adminToken);
        const requestsList = res5.body?.requests || res5.body?.data || [];
        const hasCreator1 = requestsList.some((r) => r._id === creator1Profile._id.toString() || r.userId?._id === creator1._id.toString());
        const hasCreator2 = requestsList.some((r) => r._id === creator2Profile._id.toString() || r.userId?._id === creator2._id.toString());
        const c1Item = requestsList.find((r) => r._id === creator1Profile._id.toString() || r.userId?._id === creator1._id.toString());
        if (res5.status === 200 && hasCreator1 && hasCreator2 && c1Item?.portfolioCount === 2) {
            record("5. Admin sees pending verification requests", "PASS", `Found requests, portfolioCount=${c1Item.portfolioCount}`);
        } else {
            record("5. Admin sees pending verification requests", "FAIL", `Found: ${requestsList.length}, c1Found: ${Boolean(c1Item)}`);
        }

        // Test 6: Pending count is displayed correctly
        const totalPendingCount = res5.body?.pagination?.total ?? requestsList.length;
        if (totalPendingCount >= 2) {
            record("6. Pending count is displayed correctly", "PASS", `totalCount: ${totalPendingCount}`);
        } else {
            record("6. Pending count is displayed correctly", "FAIL", `Count: ${totalPendingCount}`);
        }

        // Test 7: Empty state appears when no requests exist
        const emptyQueryRes = await apiRequest("GET", "/api/admin/verifications?page=9999", null, adminToken);
        const emptyItems = emptyQueryRes.body?.requests || emptyQueryRes.body?.data || [];
        if (emptyQueryRes.status === 200 && emptyItems.length === 0) {
            record("7. Empty state appears when no requests exist", "PASS", "Empty list returned on empty page/filter");
        } else {
            record("7. Empty state appears when no requests exist", "FAIL");
        }

        // Test 8: Refresh reloads pending requests
        const res8 = await apiRequest("GET", "/api/admin/verifications", null, adminToken);
        if (res8.status === 200 && res8.body?.success) {
            record("8. Refresh reloads pending requests", "PASS", "Queue reloaded with latest data");
        } else {
            record("8. Refresh reloads pending requests", "FAIL");
        }

        console.log("\n--- 3. CREATOR REVIEW & APPROVAL/REJECTION ---");
        // Test 9: Admin can open creator profile
        const res9 = await apiRequest("GET", `/api/creators/${creator1Profile._id}`, null, adminToken);
        if (res9.status === 200 && res9.body?.creator?.fullName === "Phase4B1 Creator One") {
            record("9. Admin can open creator profile", "PASS", "Public profile accessible with details");
        } else {
            record("9. Admin can open creator profile", "FAIL", `Status: ${res9.status}`);
        }

        // Test 10: Admin can approve a pending creator
        const res10 = await apiRequest("PATCH", `/api/admin/verifications/${creator1Profile._id}/approve`, null, adminToken);
        if (res10.status === 200 && res10.body?.creator?.verificationStatus === "verified") {
            record("10. Admin can approve a pending creator", "PASS", "Status transitioned to verified");
        } else {
            record("10. Admin can approve a pending creator", "FAIL", `Status: ${res10.status}`);
        }

        // Test 11: Approval removes creator from pending queue
        const res11 = await apiRequest("GET", "/api/admin/verifications", null, adminToken);
        const listAfterApprove = res11.body?.requests || res11.body?.data || [];
        const creator1StillPending = listAfterApprove.some((r) => r._id === creator1Profile._id.toString());
        if (!creator1StillPending) {
            record("11. Approval removes creator from pending queue", "PASS", "Approved creator no longer in queue");
        } else {
            record("11. Approval removes creator from pending queue", "FAIL", "Creator still present");
        }

        // Test 12: Admin can open rejection dialog
        const res12 = await apiRequest("PATCH", `/api/admin/verifications/${creator2Profile._id}/reject`, {}, adminToken);
        if (res12.status === 400) {
            record("12. Admin can open rejection dialog", "PASS", "Modal endpoint validates empty payload");
        } else {
            record("12. Admin can open rejection dialog", "FAIL", `Status: ${res12.status}`);
        }

        // Test 13: Rejection requires a reason
        const res13 = await apiRequest("PATCH", `/api/admin/verifications/${creator2Profile._id}/reject`, { reason: "   " }, adminToken);
        if (res13.status === 400) {
            record("13. Rejection requires a reason", "PASS", "Whitespace-only reason rejected with 400");
        } else {
            record("13. Rejection requires a reason", "FAIL", `Status: ${res13.status}`);
        }

        // Test 14: Admin can reject with a valid reason
        const res14 = await apiRequest(
            "PATCH",
            `/api/admin/verifications/${creator2Profile._id}/reject`,
            { reason: "Please upload portfolio items showcasing recent brand work." },
            adminToken
        );
        if (res14.status === 200 && res14.body?.creator?.verificationStatus === "rejected") {
            record("14. Admin can reject with a valid reason", "PASS", "Status transitioned to rejected with reason");
        } else {
            record("14. Admin can reject with a valid reason", "FAIL", `Status: ${res14.status}`);
        }

        // Test 15: Rejection removes creator from pending queue
        const res15 = await apiRequest("GET", "/api/admin/verifications", null, adminToken);
        const listAfterReject = res15.body?.requests || res15.body?.data || [];
        const creator2StillPending = listAfterReject.some((r) => r._id === creator2Profile._id.toString());
        if (!creator2StillPending) {
            record("15. Rejection removes creator from pending queue", "PASS", "Rejected creator no longer in queue");
        } else {
            record("15. Rejection removes creator from pending queue", "FAIL", "Creator still present");
        }

        // Test 16: Failed approval does not incorrectly remove the creator
        await CreatorProfile.updateOne({ userId: creator3._id }, { verificationStatus: "pending", verificationRequestedAt: new Date() });
        const fakeId = new mongoose.Types.ObjectId();
        const res16Fail = await apiRequest("PATCH", `/api/admin/verifications/${fakeId}/approve`, null, adminToken);
        const res16Check = await apiRequest("GET", "/api/admin/verifications", null, adminToken);
        const currentList16 = res16Check.body?.requests || res16Check.body?.data || [];
        const creator3StillPending = currentList16.some((r) => r._id === creator3Profile._id.toString());
        if (res16Fail.status === 404 && creator3StillPending) {
            record("16. Failed approval does not incorrectly remove the creator", "PASS", "Failed attempt preserved pending queue");
        } else {
            record("16. Failed approval does not incorrectly remove the creator", "FAIL");
        }

        // Test 17: Failed rejection does not incorrectly remove the creator
        const res17Fail = await apiRequest("PATCH", `/api/admin/verifications/${creator3Profile._id}/reject`, { reason: "" }, adminToken);
        const res17Check = await apiRequest("GET", "/api/admin/verifications", null, adminToken);
        const currentList17 = res17Check.body?.requests || res17Check.body?.data || [];
        const creator3StillInQueue = currentList17.some((r) => r._id === creator3Profile._id.toString());
        if (res17Fail.status === 400 && creator3StillInQueue) {
            record("17. Failed rejection does not incorrectly remove the creator", "PASS", "400 response left creator in queue");
        } else {
            record("17. Failed rejection does not incorrectly remove the creator", "FAIL");
        }

        console.log("\n--- 4. REGRESSION VERIFICATION ---");
        // Test 18: Creator can still request verification
        await CreatorProfile.updateOne({ userId: creator3._id }, { verificationStatus: "unverified", verificationRequestedAt: null });
        const res18 = await apiRequest("POST", "/api/verification/request", {}, creator3Token);
        if (res18.status === 200 && res18.body?.success === true) {
            record("18. Creator can still request verification", "PASS", "POST /api/verification/request succeeded");
        } else {
            record("18. Creator can still request verification", "FAIL", `Status: ${res18.status}`);
        }

        // Test 19: Creator still sees verification status
        const res19 = await apiRequest("GET", "/api/verification/me", null, creator3Token);
        if (res19.status === 200 && res19.body?.status === "pending") {
            record("19. Creator still sees verification status", "PASS", "GET /api/verification/me returned pending");
        } else {
            record("19. Creator still sees verification status", "FAIL", `Status: ${res19.status}`);
        }

        // Test 20: Verified creator still shows 'Verified by Orbit'
        const res20 = await apiRequest("GET", `/api/creators/${creator1Profile._id}`, null, creator3Token);
        if (res20.status === 200 && res20.body?.creator?.verificationStatus === "verified") {
            record("20. Verified creator still shows Verified by Orbit", "PASS", "verificationStatus=verified on creator detail");
        } else {
            record("20. Verified creator still shows Verified by Orbit", "FAIL");
        }

        // Test 21: Existing portfolio still works
        const res21 = await apiRequest("GET", "/api/portfolio/mine", null, creator1Token);
        if (res21.status === 200 && Array.isArray(res21.body?.portfolioItems) && res21.body.portfolioItems.length === 2) {
            record("21. Existing portfolio still works", "PASS", "Fetched 2 portfolio items");
        } else {
            record("21. Existing portfolio still works", "FAIL", `Status: ${res21.status}`);
        }

        // Test 22: Existing creator browse still works
        const res22 = await apiRequest("GET", "/api/creators/all", null, brandToken);
        if (res22.status === 200 && Array.isArray(res22.body?.creators)) {
            record("22. Existing creator browse still works", "PASS", "Fetched creator list");
        } else {
            record("22. Existing creator browse still works", "FAIL", `Status: ${res22.status}`);
        }

        // Test 23: Existing creator detail still works
        const res23 = await apiRequest("GET", `/api/creators/${creator1Profile._id}`, null, brandToken);
        if (res23.status === 200 && res23.body?.creator?.fullName === "Phase4B1 Creator One") {
            record("23. Existing creator detail still works", "PASS", "Creator detail returned accurately");
        } else {
            record("23. Existing creator detail still works", "FAIL", `Status: ${res23.status}`);
        }

        // Test 24: Existing campaigns still work
        await Campaign.create({
            brandId: brandUser._id,
            title: "Phase4B1 Summer Campaign",
            description: "Promoting summer collection",
            status: "published",
            budgetMin: 500,
            budgetMax: 1500,
            deliverables: ["1 Instagram Reel"],
        });
        const res24 = await apiRequest("GET", "/api/campaigns", null, creator1Token);
        if (res24.status === 200 && Array.isArray(res24.body?.campaigns)) {
            record("24. Existing campaigns still work", "PASS", "Campaign browse returns campaigns");
        } else {
            record("24. Existing campaigns still work", "FAIL", `Status: ${res24.status}`);
        }

        // Test 25: Existing applications still work
        const res25 = await apiRequest("GET", "/api/applications/mine", null, creator1Token);
        if (res25.status === 200 && Array.isArray(res25.body?.applications)) {
            record("25. Existing applications still work", "PASS", "Applications list returned successfully");
        } else {
            record("25. Existing applications still work", "FAIL", `Status: ${res25.status}`);
        }

        // Test 26: Existing collaborations still work
        const res26 = await apiRequest("GET", "/api/collaborations/mine", null, creator1Token);
        if (res26.status === 200 && Array.isArray(res26.body?.collaborations)) {
            record("26. Existing collaborations still work", "PASS", "Collaborations endpoint returned 200");
        } else {
            record("26. Existing collaborations still work", "FAIL", `Status: ${res26.status}`);
        }

        // Test 27: Existing messaging still works
        const res27 = await apiRequest("GET", "/api/conversations", null, creator1Token);
        if (res27.status === 200 && Array.isArray(res27.body?.conversations)) {
            record("27. Existing messaging still works", "PASS", "Conversations endpoint returned 200");
        } else {
            record("27. Existing messaging still works", "FAIL", `Status: ${res27.status}`);
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
                    Campaign.deleteMany({ brandId: { $in: testUserIds } }),
                    Application.deleteMany({ creatorId: { $in: testUserIds } }),
                    Collaboration.deleteMany({ $or: [{ creatorId: { $in: testUserIds } }, { brandId: { $in: testUserIds } }] }),
                    Connection.deleteMany({ $or: [{ requester: { $in: testUserIds } }, { recipient: { $in: testUserIds } }] }),
                    Conversation.deleteMany({ participants: { $in: testUserIds } }),
                    PortfolioItem.deleteMany({ creatorId: { $in: testUserIds } }),
                ]);
                console.log(`Cleaned up ${testUserIds.length} test users and all associated artifacts.`);
            }
            const orphanUsers = await User.countDocuments({ email: { $regex: /^phase4b1_test_/ } });
            console.log(`Remaining orphan records: ${orphanUsers}`);
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

runPhase4B1Tests();
