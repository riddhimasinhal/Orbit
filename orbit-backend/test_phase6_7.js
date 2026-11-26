const mongoose = require("mongoose");
const express = require("express");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./models/User");
const CreatorProfile = require("./models/CreatorProfile");
const BrandProfile = require("./models/BrandProfile");
const Connection = require("./models/Connection");
const Campaign = require("./models/Campaign");
const Application = require("./models/Application");
const Collaboration = require("./models/Collaboration");
const Contract = require("./models/Contract");
const Payment = require("./models/Payment");
const Notification = require("./models/Notification");
const Report = require("./models/Report");
const Block = require("./models/Block");
const ModerationAuditLog = require("./models/ModerationAuditLog");

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
const contractRoutes = require("./routes/contractRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const reportRoutes = require("./routes/reportRoutes");
const blockRoutes = require("./routes/blockRoutes");

function createTestApp() {
    const app = express();
    app.use(express.json({
        verify: (req, res, buf) => {
            req.rawBody = buf;
        },
    }));
    app.use("/api/auth", authRoutes);
    app.use("/api/creator", creatorRoutes);
    app.use("/api/creators", creatorRoutes);
    app.use("/api/brand", brandRoutes);
    app.use("/api/connections", connectionRoutes);
    app.use("/api/conversations", conversationRoutes);
    app.use("/api/campaigns", campaignRoutes);
    app.use("/api/applications", applicationRoutes);
    app.use("/api/collaborations", collaborationRoutes);
    app.use("/api/contracts", contractRoutes);
    app.use("/api/payments", paymentRoutes);
    app.use("/api/portfolio", portfolioRoutes);
    app.use("/api/verification", verificationRoutes);
    app.use("/api/admin", adminRoutes);
    app.use("/api/analytics", analyticsRoutes);
    app.use("/api/notifications", notificationRoutes);
    app.use("/api/reports", reportRoutes);
    app.use("/api/blocks", blockRoutes);
    return app;
}

async function runTests() {
    console.log("=================================================");
    console.log("   ORBIT PHASE 6 & PHASE 7 AUTOMATED TEST SUITE   ");
    console.log("=================================================");

    const mongoUri = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/orbit";
    await mongoose.connect(mongoUri, { dbName: "Orbit", serverSelectionTimeoutMS: 8000 });
    console.log("Connected to MongoDB (Orbit).");

    const app = createTestApp();
    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    async function apiRequest(method, path, body = null, token = null) {
        const headers = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;
        const opts = { method, headers };
        if (body) opts.body = typeof body === "string" ? body : JSON.stringify(body);
        const res = await fetch(`${baseUrl}${path}`, opts);
        let data = null;
        try {
            data = await res.json();
        } catch {
            data = null;
        }
        return { status: res.status, data };
    }

    const testId = Date.now().toString().slice(-6);
    let testsPassed = 0;
    let testsFailed = 0;

    function assert(condition, testName, detail = "") {
        if (condition) {
            console.log(`[PASS] ${testName}`);
            testsPassed++;
        } else {
            console.error(`[FAIL] ${testName} ${detail ? "- " + detail : ""}`);
            testsFailed++;
        }
    }

    // Provision test users
    const creatorUser = await User.create({
        name: `P67 Creator ${testId}`,
        email: `creator_${testId}@test.com`,
        password: "hashedpassword123",
        role: "creator",
        onBoardingCompleted: true,
        status: "active",
    });
    const creatorProfile = await CreatorProfile.create({
        userId: creatorUser._id,
        fullName: creatorUser.name,
        verificationStatus: "verified",
        currentStep: 4,
    });

    const creator2User = await User.create({
        name: `P67 Creator2 ${testId}`,
        email: `creator2_${testId}@test.com`,
        password: "hashedpassword123",
        role: "creator",
        onBoardingCompleted: true,
        status: "active",
    });
    await CreatorProfile.create({
        userId: creator2User._id,
        fullName: creator2User.name,
        currentStep: 4,
    });

    const brandUser = await User.create({
        name: `P67 Brand ${testId}`,
        email: `brand_${testId}@test.com`,
        password: "hashedpassword123",
        role: "brand",
        onBoardingCompleted: true,
        status: "active",
    });
    const brandProfile = await BrandProfile.create({
        userId: brandUser._id,
        companyName: `Brand Co ${testId}`,
        currentStep: 4,
    });

    const adminUser = await User.create({
        name: `P67 Admin ${testId}`,
        email: `admin_${testId}@test.com`,
        password: "hashedpassword123",
        role: "admin",
        onBoardingCompleted: true,
        status: "active",
    });

    const secret = process.env.JWT_SECRET || "orbit_super_secret_jwt_key_2026";
    const creatorToken = jwt.sign({ userId: creatorUser._id, role: creatorUser.role }, secret, { expiresIn: "1h" });
    const creator2Token = jwt.sign({ userId: creator2User._id, role: creator2User.role }, secret, { expiresIn: "1h" });
    const brandToken = jwt.sign({ userId: brandUser._id, role: brandUser.role }, secret, { expiresIn: "1h" });
    const adminToken = jwt.sign({ userId: adminUser._id, role: adminUser.role }, secret, { expiresIn: "1h" });

    // Seed mock collaboration and payment
    const mockPayment = await Payment.create({
        collaborationId: new mongoose.Types.ObjectId(),
        contractId: new mongoose.Types.ObjectId(),
        campaignId: new mongoose.Types.ObjectId(),
        orderId: `order_test_${testId}`,
        payerId: brandUser._id,
        recipientId: creatorUser._id,
        amount: 25000,
        currency: "INR",
        status: "successful",
        paidAt: new Date(),
    });

    try {
        // TEST 1: Creator Analytics
        console.log("\n--- Testing Phase 6A: Creator Analytics ---");
        const crAnalytics = await apiRequest("GET", "/api/analytics/creator", null, creatorToken);
        assert(crAnalytics.status === 200, "Creator analytics returned HTTP 200", `Status: ${crAnalytics.status}`);
        assert(crAnalytics.data?.overview?.totalEarnings >= 25000, "Creator total earnings aggregated real payment", `Earnings: ${crAnalytics.data?.overview?.totalEarnings}`);
        assert(Array.isArray(crAnalytics.data?.monthlyEarnings), "Creator monthly earnings array returned");

        const crAuthBlock = await apiRequest("GET", "/api/analytics/creator", null, brandToken);
        assert(crAuthBlock.status === 403, "Brand cannot access creator analytics (HTTP 403)");

        // TEST 2: Brand Analytics
        console.log("\n--- Testing Phase 6B: Brand Analytics ---");
        const brAnalytics = await apiRequest("GET", "/api/analytics/brand", null, brandToken);
        assert(brAnalytics.status === 200, "Brand analytics returned HTTP 200", `Status: ${brAnalytics.status}`);
        assert(brAnalytics.data?.overview?.totalSpent >= 25000, "Brand total spent aggregated real payment", `Spent: ${brAnalytics.data?.overview?.totalSpent}`);
        assert(Array.isArray(brAnalytics.data?.monthlySpending), "Brand monthly spending array returned");

        const brAuthBlock = await apiRequest("GET", "/api/analytics/brand", null, creatorToken);
        assert(brAuthBlock.status === 403, "Creator cannot access brand analytics (HTTP 403)");

        // TEST 3: Admin Platform Analytics
        console.log("\n--- Testing Phase 6C: Admin Analytics ---");
        const admAnalytics = await apiRequest("GET", "/api/analytics/admin", null, adminToken);
        assert(admAnalytics.status === 200, "Admin analytics returned HTTP 200", `Status: ${admAnalytics.status}`);
        assert(admAnalytics.data?.overview?.totalUsers >= 4, "Admin analytics reports total users");
        assert(admAnalytics.data?.overview?.totalPlatformVolume >= 25000, "Admin analytics reports platform volume");

        const admAuthBlock = await apiRequest("GET", "/api/analytics/admin", null, creatorToken);
        assert(admAuthBlock.status === 403, "Non-admin cannot access admin analytics (HTTP 403)");

        // TEST 4: Notifications Flow
        console.log("\n--- Testing Phase 6: In-App Notifications ---");
        const notif = await Notification.create({
            recipient: creatorUser._id,
            sender: brandUser._id,
            type: "connection_request",
            title: "New Collab Invite",
            message: "Brand invited you to collaborate.",
            link: "/requests",
        });

        const notifList = await apiRequest("GET", "/api/notifications", null, creatorToken);
        assert(notifList.status === 200 && notifList.data?.notifications?.length > 0, "Retrieved creator notifications");

        const unreadRes = await apiRequest("GET", "/api/notifications/unread-count", null, creatorToken);
        assert(unreadRes.status === 200 && unreadRes.data?.count >= 1, "Unread notification count is correct");

        const readRes = await apiRequest("PATCH", `/api/notifications/${notif._id}/read`, null, creatorToken);
        assert(readRes.status === 200 && readRes.data?.notification?.isRead === true, "Mark single notification as read");

        const readAllRes = await apiRequest("PATCH", "/api/notifications/read-all", null, creatorToken);
        assert(readAllRes.status === 200 && readAllRes.data?.unreadCount === 0, "Mark all notifications read");

        // Isolation: brand cannot delete creator's notification
        const isoDelete = await apiRequest("DELETE", `/api/notifications/${notif._id}`, null, brandToken);
        assert(isoDelete.status === 404, "Brand cannot delete creator notification (Isolation verified)");

        const deleteRes = await apiRequest("DELETE", `/api/notifications/${notif._id}`, null, creatorToken);
        assert(deleteRes.status === 200, "Creator successfully deleted their notification");

        // TEST 5: Reports Flow
        console.log("\n--- Testing Phase 7A: Reports Flow ---");
        const reportSubmit = await apiRequest("POST", "/api/reports", {
            reportedUserId: brandUser._id.toString(),
            targetType: "brand_profile",
            targetId: brandProfile._id.toString(),
            reason: "spam",
            description: "Spamming irrelevant messages repeatedly.",
        }, creatorToken);
        assert(reportSubmit.status === 201, "Submitted report against brand (HTTP 201)", `Status: ${reportSubmit.status}`);
        const reportId = reportSubmit.data?.report?._id;

        // Self-report rejection
        const selfReport = await apiRequest("POST", "/api/reports", {
            reportedUserId: creatorUser._id.toString(),
            targetType: "user",
            targetId: creatorUser._id.toString(),
            reason: "harassment",
        }, creatorToken);
        assert(selfReport.status === 400, "Self-report rejected with HTTP 400");

        // Duplicate report rejection
        const dupReport = await apiRequest("POST", "/api/reports", {
            reportedUserId: brandUser._id.toString(),
            targetType: "brand_profile",
            targetId: brandProfile._id.toString(),
            reason: "spam",
        }, creatorToken);
        assert(dupReport.status === 400, "Duplicate pending report rejected with HTTP 400");

        // Admin reviews reports
        const adminReports = await apiRequest("GET", "/api/reports/admin/all", null, adminToken);
        assert(adminReports.status === 200 && adminReports.data?.reports?.length > 0, "Admin fetched moderation reports");

        const resolveReport = await apiRequest("PATCH", `/api/reports/admin/${reportId}/status`, {
            status: "resolved",
            resolution: "Brand issued warning for unsolicited promotional messaging.",
            resolutionAction: "user_warned",
        }, adminToken);
        assert(resolveReport.status === 200 && resolveReport.data?.report?.status === "resolved", "Admin resolved report with resolution notes");

        // TEST 6: User Blocking Flow
        console.log("\n--- Testing Phase 7B: User Blocking ---");
        const blockRes = await apiRequest("POST", `/api/blocks/${brandUser._id}`, {
            reason: "Unwanted contacts",
        }, creatorToken);
        assert(blockRes.status === 200, "Creator blocked brand successfully");

        const checkBlock = await apiRequest("GET", `/api/blocks/check/${brandUser._id}`, null, creatorToken);
        assert(checkBlock.status === 200 && checkBlock.data?.isBlocked === true && checkBlock.data?.blockedByMe === true, "Block status verified");

        // Bidirectional enforcement on Connection requests:
        const connAttempt = await apiRequest("POST", "/api/connections/send", {
            receiverId: creatorUser._id.toString(),
            message: "Let's connect!",
        }, brandToken);
        assert(connAttempt.status === 403, "Blocked user cannot send connection request (HTTP 403)");

        // Unblock
        const unblockRes = await apiRequest("DELETE", `/api/blocks/${brandUser._id}`, null, creatorToken);
        assert(unblockRes.status === 200, "Creator unblocked brand successfully");

        const checkPostUnblock = await apiRequest("GET", `/api/blocks/check/${brandUser._id}`, null, creatorToken);
        assert(checkPostUnblock.data?.isBlocked === false, "Block status clear after unblock");

        // TEST 7: User Suspension & Enforcement
        console.log("\n--- Testing Phase 7C: User Suspension & Enforcement ---");
        // Self-suspension protection
        const selfSuspend = await apiRequest("PATCH", `/api/admin/users/${adminUser._id}/suspend`, {
            reason: "Admin trying to suspend self",
        }, adminToken);
        assert(selfSuspend.status === 400, "Admin self-suspension prevented (HTTP 400)");

        // Suspend creator2
        const suspendRes = await apiRequest("PATCH", `/api/admin/users/${creator2User._id}/suspend`, {
            reason: "Severe breach of community terms & fraudulent impersonation",
        }, adminToken);
        assert(suspendRes.status === 200 && suspendRes.data?.user?.status === "suspended", "Admin suspended creator2");

        // Suspended user token cannot access protected endpoints
        const suspendedAccess = await apiRequest("GET", "/api/analytics/creator", null, creator2Token);
        assert(suspendedAccess.status === 403 && suspendedAccess.data?.isSuspended === true, "Suspended user blocked from protected APIs (HTTP 403, isSuspended: true)");

        const userInDb = await User.findById(creator2User._id);
        assert(userInDb.status === "suspended", "User status in database is confirmed 'suspended'");

        // Reactivate creator2
        const reactivateRes = await apiRequest("PATCH", `/api/admin/users/${creator2User._id}/reactivate`, null, adminToken);
        assert(reactivateRes.status === 200 && reactivateRes.data?.user?.status === "active", "Admin reactivated creator2");

        // Post-reactivation: creator2 can access protected endpoints again
        const reactivatedAccess = await apiRequest("GET", "/api/analytics/creator", null, creator2Token);
        assert(reactivatedAccess.status === 200, "Reactivated user can access protected APIs again (HTTP 200)");

        // TEST 8: Moderation Audit Logs
        console.log("\n--- Testing Phase 7D: Moderation Audit Logs ---");
        const auditLogsRes = await apiRequest("GET", "/api/admin/moderation-logs", null, adminToken);
        assert(auditLogsRes.status === 200 && auditLogsRes.data?.logs?.length >= 2, "Admin retrieved immutable moderation audit logs");
        const logActions = auditLogsRes.data?.logs?.map((l) => l.action) || [];
        assert(logActions.includes("suspend_user") && logActions.includes("reactivate_user"), "Audit logs recorded suspension and reactivation actions");

    } finally {
        // Clean up test data
        console.log("\nCleaning up test artifacts...");
        await Promise.all([
            User.deleteMany({ _id: { $in: [creatorUser._id, creator2User._id, brandUser._id, adminUser._id] } }),
            CreatorProfile.deleteMany({ userId: { $in: [creatorUser._id, creator2User._id] } }),
            BrandProfile.deleteMany({ userId: brandUser._id }),
            Payment.deleteMany({ _id: mockPayment._id }),
            Notification.deleteMany({ recipient: { $in: [creatorUser._id, creator2User._id, brandUser._id] } }),
            Report.deleteMany({ reporter: { $in: [creatorUser._id, brandUser._id] } }),
            Block.deleteMany({ blocker: { $in: [creatorUser._id, brandUser._id] } }),
            ModerationAuditLog.deleteMany({ adminId: adminUser._id }),
        ]);
        server.close();
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }

    console.log("\n=================================================");
    console.log(`RESULTS: ${testsPassed} passed, ${testsFailed} failed`);
    console.log("=================================================");

    if (testsFailed > 0) {
        process.exit(1);
    } else {
        process.exit(0);
    }
}

runTests().catch((err) => {
    console.error("Test runner error:", err);
    process.exit(1);
});
