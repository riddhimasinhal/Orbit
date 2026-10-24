const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const express = require("express");
const crypto = require("crypto");
const dotenv = require("dotenv");
dotenv.config();

const User = require("./models/User");
const CreatorProfile = require("./models/CreatorProfile");
const BrandProfile = require("./models/BrandProfile");
const Campaign = require("./models/Campaign");
const Application = require("./models/Application");
const Collaboration = require("./models/Collaboration");
const Connection = require("./models/Connection");
const Contract = require("./models/Contract");
const Payment = require("./models/Payment");

const authRoutes = require("./routes/authRoutes");
const creatorRoutes = require("./routes/creatorRoutes");
const brandRoutes = require("./routes/brandRoutes");
const connectionRoutes = require("./routes/connectionRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const campaignRoutes = require("./routes/campaignRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const collaborationRoutes = require("./routes/collaborationRoutes");
const contractRoutes = require("./routes/contractRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

function createTestApp() {
    const app = express();
    app.use(express.json({
        verify: (req, res, buf) => {
            req.rawBody = buf;
        },
    }));
    app.use("/api/auth", authRoutes);
    app.use("/api/creator", creatorRoutes);
    app.use("/api/brand", brandRoutes);
    app.use("/api/connections", connectionRoutes);
    app.use("/api/conversations", conversationRoutes);
    app.use("/api/campaigns", campaignRoutes);
    app.use("/api/applications", applicationRoutes);
    app.use("/api/collaborations", collaborationRoutes);
    app.use("/api/contracts", contractRoutes);
    app.use("/api/payments", paymentRoutes);
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

async function runPhase5Tests() {
    console.log("==========================================");
    console.log("   ORBIT PHASE 5 E2E VALIDATION SUITE     ");
    console.log("   (Contracts & Payments Security & Flow) ");
    console.log("==========================================");

    let connectedTo = "";
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: "Orbit", serverSelectionTimeoutMS: 5000 });
        connectedTo = "MongoDB Atlas Live Cluster";
    } catch (err) {
        console.log("Atlas connection timed out. Falling back to local MongoDB on 127.0.0.1:27017...");
        await mongoose.connect("mongodb://127.0.0.1:27017/Orbit_Phase5_Test", { serverSelectionTimeoutMS: 5000 });
        connectedTo = "Local MongoDB (127.0.0.1:27017/Orbit_Phase5_Test)";
    }
    console.log(`Connected to: ${connectedTo}\n`);

    const app = createTestApp();
    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    async function apiRequest(method, path, body = null, token = null, customHeaders = {}) {
        const headers = { "Content-Type": "application/json", ...customHeaders };
        if (token) headers["Authorization"] = token;
        const opts = { method, headers };
        if (body) opts.body = typeof body === "string" ? body : JSON.stringify(body);
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
            Contract.deleteMany({ $or: [{ brandId: { $in: userIds } }, { creatorId: { $in: userIds } }] }),
            Payment.deleteMany({ $or: [{ payerId: { $in: userIds } }, { recipientId: { $in: userIds } }] }),
            Connection.deleteMany({ $or: [{ senderId: { $in: userIds } }, { receiverId: { $in: userIds } }] }),
        ]);
    }

    let createdUserIds = [];

    try {
        // Initial cleanup of stale phase5 test records
        const staleUsers = await User.find({ email: { $regex: /^phase5_test_/ } });
        if (staleUsers.length) {
            await cleanup(staleUsers.map(u => u._id));
        }

        const now = Date.now();

        // 1. Create Brand 1 (Contract Owner & Payer)
        const brand1 = await User.create({
            name: "Phase5 Alpha Brand",
            fullName: "Phase5 Alpha Brand",
            companyName: "Alpha Devices",
            email: `phase5_test_brand1_${now}@example.com`,
            password: "hashedpassword123",
            role: "brand",
            onBoardingCompleted: true,
        });
        await BrandProfile.create({
            userId: brand1._id,
            companyName: "Alpha Devices",
            industry: "Technology",
            location: "Bangalore, India",
        });
        const brand1Token = generateToken(brand1);

        // 2. Create Brand 2 (Unrelated Brand)
        const brand2 = await User.create({
            name: "Phase5 Beta Brand",
            fullName: "Phase5 Beta Brand",
            companyName: "Beta Apparel",
            email: `phase5_test_brand2_${now}@example.com`,
            password: "hashedpassword123",
            role: "brand",
            onBoardingCompleted: true,
        });
        await BrandProfile.create({
            userId: brand2._id,
            companyName: "Beta Apparel",
            industry: "Fashion",
            location: "Mumbai, India",
        });
        const brand2Token = generateToken(brand2);

        // 3. Create Creator 1 (Contract Recipient & Collaborator)
        const creator1 = await User.create({
            name: "Phase5 Star Creator",
            fullName: "Phase5 Star Creator",
            email: `phase5_test_creator1_${now}@example.com`,
            password: "hashedpassword123",
            role: "creator",
            onBoardingCompleted: true,
        });
        await CreatorProfile.create({
            userId: creator1._id,
            bio: "Tech influencer & hardware tester",
            primaryPlatform: "YouTube",
        });
        const creator1Token = generateToken(creator1);

        // 4. Create Creator 2 (Unrelated Creator)
        const creator2 = await User.create({
            name: "Phase5 Unrelated Creator",
            fullName: "Phase5 Unrelated Creator",
            email: `phase5_test_creator2_${now}@example.com`,
            password: "hashedpassword123",
            role: "creator",
            onBoardingCompleted: true,
        });
        await CreatorProfile.create({
            userId: creator2._id,
            bio: "Fashion blogger",
            primaryPlatform: "Instagram",
        });
        const creator2Token = generateToken(creator2);

        createdUserIds = [brand1._id, brand2._id, creator1._id, creator2._id];

        // 5. Create Campaign owned by Brand 1
        const campaign1 = await Campaign.create({
            brandId: brand1._id,
            title: "Phase5 Flagship Phone Launch",
            description: "Dedicated reviews of the new Alpha Phone.",
            category: "Technology",
            budgetMin: 40000,
            budgetMax: 50000,
            status: "published",
            deliverables: ["1x Unboxing Short", "1x Full Review Video"],
        });

        // 6. Create Application from Creator 1 to Campaign 1
        const app1 = await Application.create({
            campaignId: campaign1._id,
            creatorId: creator1._id,
            pitch: "I am ready to deliver top-tier content for this launch.",
            proposedBudget: 45000,
            status: "accepted",
        });

        // 7. Create Active Collaboration
        const collab1 = await Collaboration.create({
            campaignId: campaign1._id,
            applicationId: app1._id,
            brandId: brand1._id,
            creatorId: creator1._id,
            status: "active",
            deliverables: [
                {
                    title: "1x Unboxing Short",
                    description: "High quality vertical short",
                    status: "pending",
                },
                {
                    title: "1x Full Review Video",
                    description: "10-minute in-depth review",
                    status: "pending",
                },
            ],
        });
        const collab1Id = collab1._id.toString();

        console.log(`\nSetup ready. Collab ID: ${collab1Id}\n`);

        let contractId = null;

        // --- TEST 1: Contract creation and retrieval ---
        {
            const createRes = await apiRequest("POST", `/api/contracts/collaboration/${collab1Id}`, {
                title: "Alpha Phone Campaign Agreement",
                amount: 45000,
                currency: "INR",
                paymentTerms: "100% on deliverable approval",
                deliverables: [
                    { title: "1x Unboxing Short", description: "Snapshotted Short" },
                    { title: "1x Full Review Video", description: "Snapshotted Video" },
                ],
                sendImmediate: false,
            }, brand1Token);

            const getRes = await apiRequest("GET", `/api/contracts/collaboration/${collab1Id}`, null, creator1Token);

            const passed = createRes.status === 201 &&
                getRes.status === 200 &&
                getRes.body?.contract?.compensation?.amount === 45000 &&
                getRes.body?.contract?.compensation?.currency === "INR" &&
                getRes.body?.contract?.version === 1 &&
                getRes.body?.contract?.status === "draft";

            if (passed) contractId = getRes.body.contract._id;
            record("Test 1: Contract creation and retrieval", passed, `Status: ${createRes.status}/${getRes.status}`);
        }

        // --- TEST 2: Unauthorized access to another collaboration's contract (403) ---
        {
            const resCreator2 = await apiRequest("GET", `/api/contracts/collaboration/${collab1Id}`, null, creator2Token);
            const resBrand2 = await apiRequest("GET", `/api/contracts/collaboration/${collab1Id}`, null, brand2Token);
            const passed = resCreator2.status === 403 && resBrand2.status === 403;
            record("Test 2: Unauthorized access to another collaboration's contract rejected (403)", passed, `Creator2: ${resCreator2.status}, Brand2: ${resBrand2.status}`);
        }

        // --- TEST 3 & 4: Creator and brand acceptance; acceptance by only one party does NOT finalize contract ---
        {
            // First brand sends contract
            const sendRes = await apiRequest("POST", `/api/contracts/${contractId}/send`, {}, brand1Token);
            // Upon sending, brandAcceptance is recorded, but creatorAcceptance is still false
            const checkSent = await apiRequest("GET", `/api/contracts/${contractId}`, null, creator1Token);

            const brandAcceptedOnly = checkSent.body?.contract?.brandAcceptance?.accepted === true &&
                checkSent.body?.contract?.creatorAcceptance?.accepted === false &&
                checkSent.body?.contract?.status === "sent";

            record("Test 4: Acceptance by only one party does NOT finalize contract", brandAcceptedOnly, `Status remains: ${checkSent.body?.contract?.status}`);

            // Now creator accepts
            const acceptRes = await apiRequest("POST", `/api/contracts/${contractId}/accept`, {}, creator1Token);
            const checkFinal = await apiRequest("GET", `/api/contracts/${contractId}`, null, creator1Token);

            const passed = acceptRes.status === 200 &&
                checkFinal.body?.contract?.status === "accepted" &&
                checkFinal.body?.contract?.creatorAcceptance?.accepted === true &&
                checkFinal.body?.contract?.brandAcceptance?.accepted === true;

            record("Test 3 & 5: Both parties accepting the same version finalizes it (accepted)", passed, `Status: ${checkFinal.body?.contract?.status}`);
        }

        // --- TEST 6: Accepted terms cannot be modified in place ---
        {
            // Brand attempts to modify the accepted contract via create/draft endpoint
            const res = await apiRequest("POST", `/api/contracts/collaboration/${collab1Id}`, {
                amount: 30000,
            }, brand1Token);

            const passed = res.status === 400 && res.body?.message?.toLowerCase().includes("accepted");
            record("Test 6: Accepted terms cannot be modified in place (400)", passed, `Status: ${res.status}`);
        }

        // --- TEST 7: Contract version changes require new acceptance ---
        {
            // Brand revises the contract to version 2
            const reviseRes = await apiRequest("POST", `/api/contracts/${contractId}/revise`, {
                amount: 50000,
                currency: "INR",
                note: "Increased compensation to 50,000 INR",
                sendImmediate: true,
            }, brand1Token);

            const checkV2 = await apiRequest("GET", `/api/contracts/${contractId}`, null, creator1Token);
            const v2 = checkV2.body?.contract;

            // Brand accepted upon sending revised version, but creator acceptance must be reset to false!
            const passed = reviseRes.status === 200 &&
                v2?.version === 2 &&
                v2?.compensation?.amount === 50000 &&
                v2?.status === "sent" &&
                v2?.creatorAcceptance?.accepted === false &&
                v2?.history?.length === 1 &&
                v2?.history[0]?.version === 1;

            record("Test 7: Contract version changes require new acceptance (v2 reset to sent)", passed, `Version: ${v2?.version}, Status: ${v2?.status}`);
        }

        // --- TEST 8: Invalid lifecycle transitions are rejected ---
        {
            // Cannot accept a contract that is already accepted or invalid status
            // Creator accepts v2 so it becomes accepted
            await apiRequest("POST", `/api/contracts/${contractId}/accept`, {}, creator1Token);

            // Now attempting to accept already accepted v2 should return 400
            const doubleAcceptRes = await apiRequest("POST", `/api/contracts/${contractId}/accept`, {}, creator1Token);

            // Attempting to reject an already accepted contract should return 400
            const rejectAcceptedRes = await apiRequest("POST", `/api/contracts/${contractId}/reject`, { reason: "Too late" }, creator1Token);

            const passed = doubleAcceptRes.status === 400 && rejectAcceptedRes.status === 400;
            record("Test 8: Invalid lifecycle transitions are rejected (400)", passed, `Statuses: ${doubleAcceptRes.status}, ${rejectAcceptedRes.status}`);
        }

        // --- TEST 9: Payment initiation uses the accepted contract amount ---
        let paymentOrderId = null;
        let paymentRecordId = null;
        {
            const res = await apiRequest("POST", `/api/payments/collaboration/${collab1Id}/initiate`, {}, brand1Token);

            const passed = res.status === 201 &&
                res.body?.payment?.amount === 50000 &&
                res.body?.payment?.currency === "INR" &&
                res.body?.payment?.status === "pending" &&
                Boolean(res.body?.orderId);

            if (passed) {
                paymentOrderId = res.body.orderId;
                paymentRecordId = res.body.payment._id;
            }
            record("Test 9: Payment initiation uses the accepted contract amount (50,000 INR)", passed, `Order: ${paymentOrderId}, Amount: ${res.body?.payment?.amount}`);
        }

        // --- TEST 10: Frontend-supplied amount manipulation is rejected or ignored ---
        {
            // Attacker attempts to initiate payment sending amount: 100 instead of 50000
            const res = await apiRequest("POST", `/api/payments/collaboration/${collab1Id}/initiate`, {
                amount: 100, // Attacker tries to pay ₹100
            }, brand1Token);

            // Server must derive the amount strictly from the contract (50000), ignoring frontend 100
            const passed = res.status === 201 && res.body?.payment?.amount === 50000;
            record("Test 10: Frontend-supplied amount manipulation is ignored (uses contract 50,000 INR)", passed, `Recorded amount: ${res.body?.payment?.amount}`);
        }

        // --- TEST 11: Invalid provider signatures are rejected ---
        {
            const res = await apiRequest("POST", "/api/payments/verify", {
                orderId: paymentOrderId,
                paymentId: "pay_tampered_12345",
                signature: "invalid_forged_hmac_signature",
            }, brand1Token);

            const checkPayment = await Payment.findOne({ orderId: paymentOrderId });
            const passed = res.status === 400 && checkPayment?.status === "failed";
            record("Test 11: Invalid provider signatures are rejected (400) and marked failed", passed, `Status: ${res.status}, DB Status: ${checkPayment?.status}`);
        }

        // --- TEST 12: Duplicate webhook events do not process twice (Idempotency) ---
        {
            // Initiate a fresh order for webhook testing
            const initRes = await apiRequest("POST", `/api/payments/collaboration/${collab1Id}/initiate`, {}, brand1Token);
            const webhookOrderId = initRes.body.orderId;
            const webhookPaymentId = `pay_hook_${Date.now()}`;
            const eventId = `evt_${Date.now()}`;

            const secret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET || "orbit_webhook_secret";

            const payloadObj = {
                event: "payment.captured",
                event_id: eventId,
                payload: {
                    payment: {
                        entity: {
                            id: webhookPaymentId,
                            order_id: webhookOrderId,
                            amount: 5000000,
                            status: "captured",
                        },
                    },
                },
            };
            const payloadStr = JSON.stringify(payloadObj);
            const signature = crypto.createHmac("sha256", secret).update(payloadStr).digest("hex");

            // First delivery
            const res1 = await apiRequest("POST", "/api/payments/webhook", payloadStr, null, {
                "x-razorpay-signature": signature,
                "x-razorpay-event-id": eventId,
            });

            // Duplicate delivery of the exact same event
            const res2 = await apiRequest("POST", "/api/payments/webhook", payloadStr, null, {
                "x-razorpay-signature": signature,
                "x-razorpay-event-id": eventId,
            });

            const paymentDoc = await Payment.findOne({ orderId: webhookOrderId });
            const passed = res1.status === 200 &&
                res2.status === 200 &&
                res2.body?.status === "ignored" &&
                paymentDoc?.webhookEvents?.length === 1 &&
                paymentDoc?.status === "successful";

            record("Test 12: Duplicate webhook events do not process twice (Idempotency verified)", passed, `Event count in DB: ${paymentDoc?.webhookEvents?.length}`);
        }

        // --- TEST 13: Failed payments do not become successful ---
        {
            const failedPayment = await Payment.findOne({ orderId: paymentOrderId });
            // Attempting to verify or transition an already failed payment with an invalid signature fails
            const res = await apiRequest("POST", "/api/payments/verify", {
                orderId: paymentOrderId,
                paymentId: "pay_retry_bad",
                signature: "still_bad_signature",
            }, brand1Token);

            const rechecked = await Payment.findOne({ orderId: paymentOrderId });
            const passed = res.status === 400 && rechecked.status === "failed";
            record("Test 13: Failed payments do not become successful", passed, `Final DB Status: ${rechecked.status}`);
        }

        // --- TEST 14: Unauthorized users cannot access payment records (403) ---
        {
            const resCreator2 = await apiRequest("GET", `/api/payments/collaboration/${collab1Id}`, null, creator2Token);
            const resBrand2 = await apiRequest("GET", `/api/payments/collaboration/${collab1Id}`, null, brand2Token);
            const resAuth = await apiRequest("GET", `/api/payments/collaboration/${collab1Id}`, null, creator1Token);

            const passed = resCreator2.status === 403 &&
                resBrand2.status === 403 &&
                resAuth.status === 200 &&
                Array.isArray(resAuth.body?.payments);

            record("Test 14: Unauthorized users cannot access payment records (403 for non-participants)", passed, `Creator2: ${resCreator2.status}, Brand2: ${resBrand2.status}, Authorized: ${resAuth.status}`);
        }

        // --- TEST 15: Existing collaboration and deliverable functionality remains intact ---
        {
            const collabRes = await apiRequest("GET", `/api/collaborations/${collab1Id}`, null, creator1Token);
            const deliverables = collabRes.body?.collaboration?.deliverables || [];
            const firstDeliverableId = deliverables[0]?._id?.toString();

            const submitRes = await apiRequest("POST", `/api/collaborations/${collab1Id}/deliverables/${firstDeliverableId}/submit`, {
                submissionUrl: "https://youtube.com/watch?v=flagship_review",
                submissionNotes: "Ready for review",
            }, creator1Token);

            const approveRes = await apiRequest("POST", `/api/collaborations/${collab1Id}/deliverables/${firstDeliverableId}/approve`, {}, brand1Token);

            const passed = collabRes.status === 200 &&
                submitRes.status === 200 &&
                approveRes.status === 200 &&
                approveRes.body?.deliverable?.status === "approved";

            record("Test 15: Existing collaboration and deliverable functionality remains intact", passed, `Collab: ${collabRes.status}, Deliverable: ${approveRes.body?.deliverable?.status}`);
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

runPhase5Tests().then((allPassed) => {
    process.exit(allPassed ? 0 : 1);
});
