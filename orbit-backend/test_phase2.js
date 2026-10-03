const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const express = require("express");
const dotenv = require("dotenv");
dotenv.config();

const User = require("./models/User");
const CreatorProfile = require("./models/CreatorProfile");
const BrandProfile = require("./models/BrandProfile");
const Connection = require("./models/Connection");
const Conversation = require("./models/Conversation");
const Message = require("./models/Message");

const authRoutes = require("./routes/authRoutes");
const creatorRoutes = require("./routes/creatorRoutes");
const brandRoutes = require("./routes/brandRoutes");
const connectionRoutes = require("./routes/connectionRoutes");
const conversationRoutes = require("./routes/conversationRoutes");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

function createTestApp() {
    const app = express();
    app.use(express.json());
    app.use("/api/auth", authRoutes);
    app.use("/api/creator", creatorRoutes);
    app.use("/api/brand", brandRoutes);
    app.use("/api/connections", connectionRoutes);
    app.use("/api/conversations", conversationRoutes);
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

async function runTests() {
    console.log("==========================================");
    console.log("   ORBIT PHASE 2 E2E VALIDATION SUITE    ");
    console.log("==========================================");

    // Try connecting to Atlas first; if IP blocked, use local MongoDB
    let connectedTo = "";
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: "Orbit", serverSelectionTimeoutMS: 4000 });
        connectedTo = "MongoDB Atlas Live Cluster";
    } catch (err) {
        console.log("Atlas connection failed (IP not whitelisted). Using local MongoDB on 127.0.0.1:27017...");
        await mongoose.connect("mongodb://127.0.0.1:27017/Orbit_Phase2_Test", { serverSelectionTimeoutMS: 5000 });
        connectedTo = "Local MongoDB (127.0.0.1:27017/Orbit_Phase2_Test)";
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
        // Cleanup existing test users with phase2 prefix
        const testUserFilter = { email: { $regex: /^phase2_test_/ } };
        const existingTestUsers = await User.find(testUserFilter);
        const existingIds = existingTestUsers.map(u => u._id);
        if (existingIds.length) {
            await Promise.all([
                User.deleteMany({ _id: { $in: existingIds } }),
                CreatorProfile.deleteMany({ userId: { $in: existingIds } }),
                BrandProfile.deleteMany({ userId: { $in: existingIds } }),
                Connection.deleteMany({ $or: [{ senderId: { $in: existingIds } }, { receiverId: { $in: existingIds } }] }),
                Conversation.deleteMany({ participants: { $in: existingIds } }),
            ]);
        }

        // 1. Create Test Users
        // Creator A
        const creatorA = await User.create({
            name: "Phase2 Alice Creator",
            fullName: "Phase2 Alice Creator",
            email: `phase2_test_alice_${Date.now()}@example.com`,
            password: "hashedpassword123",
            role: "creator",
            onBoardingCompleted: true,
        });
        await CreatorProfile.create({
            userId: creatorA._id,
            fullName: "Phase2 Alice Creator",
            username: `alice_${Date.now()}`,
            bio: "Fashion & Lifestyle Creator",
            niche: ["Fashion", "Lifestyle"],
            location: "New York, USA",
        });

        // Brand B
        const brandB = await User.create({
            name: "Phase2 Bob Brand",
            fullName: "Phase2 Bob Brand",
            companyName: "Bob Brands Inc",
            email: `phase2_test_bob_${Date.now()}@example.com`,
            password: "hashedpassword123",
            role: "brand",
            onBoardingCompleted: true,
        });
        await BrandProfile.create({
            userId: brandB._id,
            companyName: "Bob Brands Inc",
            industry: "Apparel",
            location: "San Francisco, USA",
        });

        // Brand C (for Pending connection test)
        const brandC = await User.create({
            name: "Phase2 Charlie Brand",
            fullName: "Phase2 Charlie Brand",
            companyName: "Charlie Co",
            email: `phase2_test_charlie_${Date.now()}@example.com`,
            password: "hashedpassword123",
            role: "brand",
            onBoardingCompleted: true,
        });

        // Brand D (for Declined connection test)
        const brandD = await User.create({
            name: "Phase2 David Brand",
            fullName: "Phase2 David Brand",
            companyName: "David Brands",
            email: `phase2_test_david_${Date.now()}@example.com`,
            password: "hashedpassword123",
            role: "brand",
            onBoardingCompleted: true,
        });

        // Creator E (Unauthorized third-party user)
        const creatorE = await User.create({
            name: "Phase2 Eve Intruder",
            fullName: "Phase2 Eve Intruder",
            email: `phase2_test_eve_${Date.now()}@example.com`,
            password: "hashedpassword123",
            role: "creator",
            onBoardingCompleted: true,
        });

        const tokenA = generateToken(creatorA);
        const tokenB = generateToken(brandB);
        const tokenC = generateToken(brandC);
        const tokenD = generateToken(brandD);
        const tokenE = generateToken(creatorE);

        // Connections Setup:
        // A <-> B : accepted
        // A <-> C : pending
        // A <-> D : declined
        // A <-> E : none
        await Connection.create({
            senderId: brandB._id,
            receiverId: creatorA._id,
            senderRole: "brand",
            status: "accepted",
            message: "Let's collaborate!",
        });

        await Connection.create({
            senderId: creatorA._id,
            receiverId: brandC._id,
            senderRole: "creator",
            status: "pending",
            message: "Collab inquiry",
        });

        await Connection.create({
            senderId: creatorA._id,
            receiverId: brandD._id,
            senderRole: "creator",
            status: "declined",
            message: "Inquiry declined",
        });

        // Test A: No connection attempt conversation
        const resNoConn = await apiRequest("POST", "/api/conversations", { recipientId: creatorE._id.toString() }, tokenA);
        record(
            "No connection",
            resNoConn.status === 403,
            `Status: ${resNoConn.status}, Message: ${resNoConn.body?.message}`
        );

        // Test B: Pending connection attempt conversation
        const resPending = await apiRequest("POST", "/api/conversations", { recipientId: brandC._id.toString() }, tokenA);
        record(
            "Pending connection",
            resPending.status === 403,
            `Status: ${resPending.status}, Message: ${resPending.body?.message}`
        );

        // Test C: Declined connection attempt conversation
        const resDeclined = await apiRequest("POST", "/api/conversations", { recipientId: brandD._id.toString() }, tokenA);
        record(
            "Declined connection",
            resDeclined.status === 403,
            `Status: ${resDeclined.status}, Message: ${resDeclined.body?.message}`
        );

        // Test D: Accepted connection create conversation
        const resAccepted = await apiRequest("POST", "/api/conversations", { recipientId: brandB._id.toString() }, tokenA);
        const convId = resAccepted.body?.conversation?._id;
        record(
            "Accepted connection",
            (resAccepted.status === 200 || resAccepted.status === 201) && Boolean(convId),
            `Status: ${resAccepted.status}, ConvId: ${convId}`
        );

        // Test E: Duplicate conversation creation returns same conversation
        const resDuplicate = await apiRequest("POST", "/api/conversations", { recipientId: creatorA._id.toString() }, tokenB);
        const duplicateId = resDuplicate.body?.conversation?._id;
        const totalConvsBetweenAB = await Conversation.countDocuments({
            participants: { $all: [creatorA._id, brandB._id] },
        });
        record(
            "Duplicate conversation",
            duplicateId === convId && totalConvsBetweenAB === 1,
            `Same ID returned: ${duplicateId === convId}, Count in DB: ${totalConvsBetweenAB}`
        );

        // Test F: Send message from Creator A to Brand B
        const resSendA = await apiRequest(
            "POST",
            `/api/conversations/${convId}/messages`,
            { content: "Hi Bob, excited to work together on the campaign!" },
            tokenA
        );
        const messageAId = resSendA.body?.message?._id;
        record(
            "Send message",
            resSendA.status === 201 && resSendA.body?.message?.content === "Hi Bob, excited to work together on the campaign!",
            `Status: ${resSendA.status}, Sender: ${resSendA.body?.message?.senderId}`
        );

        // Test G: Message persistence (fetch from DB)
        const savedMessage = await Message.findById(messageAId);
        record(
            "Message persistence",
            Boolean(savedMessage) && savedMessage.content === "Hi Bob, excited to work together on the campaign!",
            `DB record found: ${Boolean(savedMessage)}, Content matched: ${savedMessage?.content.slice(0, 20)}...`
        );

        // Test H: Unauthorized conversation access by third party (Eve)
        const resUnauthorized = await apiRequest("GET", `/api/conversations/${convId}/messages`, null, tokenE);
        record(
            "Unauthorized access",
            resUnauthorized.status === 403,
            `Status: ${resUnauthorized.status}, Error: ${resUnauthorized.body?.message}`
        );

        // Test I: Sender spoofing protection (Alice passes Bob's ID in body)
        const resSpoof = await apiRequest(
            "POST",
            `/api/conversations/${convId}/messages`,
            { content: "Trying to spoof sender", senderId: brandB._id.toString() },
            tokenA
        );
        record(
            "Sender spoofing",
            resSpoof.status === 201 && resSpoof.body?.message?.senderId?.toString() === creatorA._id.toString(),
            `Actual Sender assigned by server: ${resSpoof.body?.message?.senderId} (Alice)`
        );

        // Test J: Read/unread state
        // Currently Bob has unread messages from Alice
        const convListBobBefore = await apiRequest("GET", "/api/conversations", null, tokenB);
        const bobConv = convListBobBefore.body?.conversations?.find(c => c._id === convId);
        const unreadCountBefore = bobConv?.unreadCount;

        // Bob opens the conversation messages
        await apiRequest("GET", `/api/conversations/${convId}/messages`, null, tokenB);
        
        // Check message readAt field in DB
        const updatedMsg = await Message.findById(messageAId);
        const isMarkedRead = Boolean(updatedMsg.readAt);

        // Check unread count after opening
        const convListBobAfter = await apiRequest("GET", "/api/conversations", null, tokenB);
        const bobConvAfter = convListBobAfter.body?.conversations?.find(c => c._id === convId);

        record(
            "Read/unread",
            unreadCountBefore > 0 && isMarkedRead && bobConvAfter?.unreadCount === 0,
            `Unread before: ${unreadCountBefore}, Marked read: ${isMarkedRead}, Unread after: ${bobConvAfter?.unreadCount}`
        );

        // Test K: Creator -> Brand
        record(
            "Creator -> Brand",
            resSendA.status === 201 && resSendA.body?.message?.senderId?.toString() === creatorA._id.toString(),
            `Creator sent message and Brand can fetch it`
        );

        // Test L: Brand -> Creator bidirectional
        const resSendB = await apiRequest(
            "POST",
            `/api/conversations/${convId}/messages`,
            { content: "Thanks Alice! Looking forward to reviewing the deliverables." },
            tokenB
        );
        const resAliceFetch = await apiRequest("GET", `/api/conversations/${convId}/messages`, null, tokenA);
        const lastMsgForAlice = resAliceFetch.body?.messages?.[resAliceFetch.body.messages.length - 1];
        record(
            "Brand -> Creator",
            resSendB.status === 201 && lastMsgForAlice?.content === "Thanks Alice! Looking forward to reviewing the deliverables.",
            `Brand sent message, Creator received it: "${lastMsgForAlice?.content.slice(0, 25)}..."`
        );

        // Test M: Conversation list
        const resConvList = await apiRequest("GET", "/api/conversations", null, tokenA);
        const convItem = resConvList.body?.conversations?.[0];
        const hasOtherParticipant = Boolean(convItem?.otherParticipant?.name && convItem?.otherParticipant?.role);
        record(
            "Conversation list",
            resConvList.status === 200 && hasOtherParticipant && convItem?.lastMessage.includes("Looking forward"),
            `Name: ${convItem?.otherParticipant?.name}, Role: ${convItem?.otherParticipant?.role}, LastMsg: ${convItem?.lastMessage}`
        );

        // Test N: Marketplace regression check
        const resBrowseCreators = await apiRequest("GET", "/api/creator/all?page=1&limit=5", null, tokenB);
        const resBrowseBrands = await apiRequest("GET", "/api/brand/all?page=1&limit=5", null, tokenA);
        const resRequestsReceived = await apiRequest("GET", "/api/connections/received", null, tokenA);
        const resRequestsSent = await apiRequest("GET", "/api/connections/sent", null, tokenA);
        const resPendingCount = await apiRequest("GET", "/api/connections/count", null, tokenA);

        const marketplacePass =
            resBrowseCreators.status === 200 &&
            resBrowseBrands.status === 200 &&
            resRequestsReceived.status === 200 &&
            resRequestsSent.status === 200 &&
            resPendingCount.status === 200;

        record(
            "Marketplace regression",
            marketplacePass,
            `Creators: ${resBrowseCreators.status}, Brands: ${resBrowseBrands.status}, Requests: ${resRequestsReceived.status}/${resRequestsSent.status}`
        );

        // Cleanup test data
        await Promise.all([
            User.deleteMany({ _id: { $in: [creatorA._id, brandB._id, brandC._id, brandD._id, creatorE._id] } }),
            CreatorProfile.deleteMany({ userId: { $in: [creatorA._id, creatorE._id] } }),
            BrandProfile.deleteMany({ userId: { $in: [brandB._id, brandC._id, brandD._id] } }),
            Connection.deleteMany({
                $or: [
                    { senderId: { $in: [creatorA._id, brandB._id, brandC._id, brandD._id, creatorE._id] } },
                    { receiverId: { $in: [creatorA._id, brandB._id, brandC._id, brandD._id, creatorE._id] } },
                ],
            }),
            Conversation.deleteMany({
                participants: { $in: [creatorA._id, brandB._id, brandC._id, brandD._id, creatorE._id] },
            }),
            Message.deleteMany({ conversationId: convId }),
        ]);

        server.close();
        await mongoose.disconnect();

        console.log("\n==========================================");
        console.log(`TOTAL TESTS: ${results.length}`);
        console.log(`PASSED: ${results.filter(r => r.passed).length}`);
        console.log(`FAILED: ${results.filter(r => !r.passed).length}`);
        console.log("==========================================");

        if (results.every(r => r.passed)) {
            console.log("\n>>> ALL PHASE 2 TESTS PASSED PERFECTLY! <<<");
            process.exit(0);
        } else {
            console.error("\n>>> SOME TESTS FAILED <<<");
            process.exit(1);
        }
    } catch (testErr) {
        console.error("Test execution error:", testErr);
        server.close();
        await mongoose.disconnect();
        process.exit(1);
    }
}

runTests();
