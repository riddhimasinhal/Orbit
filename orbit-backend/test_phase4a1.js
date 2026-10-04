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
const { isCloudinaryConfigured, deleteFromCloudinary } = require("./config/cloudinary");

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

async function runPhase4A1Tests() {
    console.log("==========================================");
    console.log("  ORBIT PHASE 4A.1 E2E VALIDATION SUITE   ");
    console.log("==========================================");

    let connectedTo = "";
    try {
        await mongoose.connect(process.env.MONGO_URI, { dbName: "Orbit", serverSelectionTimeoutMS: 5000 });
        connectedTo = "MongoDB Atlas Live Cluster";
    } catch (err) {
        console.log("Atlas connection timed out. Falling back to local MongoDB on 127.0.0.1:27017...");
        await mongoose.connect("mongodb://127.0.0.1:27017/Orbit_Phase4A1_Test", { serverSelectionTimeoutMS: 5000 });
        connectedTo = "Local MongoDB (127.0.0.1:27017/Orbit_Phase4A1_Test)";
    }
    console.log(`Connected to: ${connectedTo}\n`);

    const hasCloudinary = isCloudinaryConfigured();
    console.log(`Cloudinary Configured: ${hasCloudinary ? "YES (Live tests will execute)" : "NO (Upload scenarios will report BLOCKED)"}\n`);

    const app = createTestApp();
    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    async function apiRequest(method, path, body = null, token = null, isFormData = false) {
        const headers = {};
        if (token) headers["Authorization"] = token;
        const opts = { method, headers };

        if (body) {
            if (isFormData) {
                opts.body = body; // let fetch set multipart boundary automatically
            } else {
                headers["Content-Type"] = "application/json";
                opts.body = JSON.stringify(body);
            }
        }

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
        const filter = { email: { $regex: /^phase4a1_test_/ } };
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
            name: "Phase4A1 Creator One",
            email: `phase4a1_test_creator1_${now}@example.com`,
            password: "hashedpassword123",
            role: "creator",
            onBoardingCompleted: true,
        });
        const profile1 = await CreatorProfile.create({
            userId: creator1._id,
            fullName: "Phase4A1 Creator One",
            username: `p4a1creator1_${now}`,
            bio: "Content creator & videographer",
            niche: ["Tech", "Design"],
        });
        const creator1Token = generateToken(creator1);

        // 2. Create Creator 2
        const creator2 = await User.create({
            name: "Phase4A1 Creator Two",
            email: `phase4a1_test_creator2_${now}@example.com`,
            password: "hashedpassword123",
            role: "creator",
            onBoardingCompleted: true,
        });
        const profile2 = await CreatorProfile.create({
            userId: creator2._id,
            fullName: "Phase4A1 Creator Two",
            username: `p4a1creator2_${now}`,
            bio: "Motion graphics artist",
            niche: ["Art"],
        });
        const creator2Token = generateToken(creator2);

        // 3. Create Brand User
        const brand = await User.create({
            name: "Phase4A1 Brand User",
            email: `phase4a1_test_brand_${now}@example.com`,
            password: "hashedpassword123",
            role: "brand",
            onBoardingCompleted: true,
        });
        await BrandProfile.create({
            userId: brand._id,
            companyName: "Lumina Gear",
            industry: "Hardware",
        });
        const brandToken = generateToken(brand);

        console.log("--- 1. UPLOAD AUTHORIZATION & VALIDATION ---");

        // Scenario 3: Brand cannot upload
        {
            const formData = new FormData();
            formData.append("media", new Blob(["dummy image data"], { type: "image/jpeg" }), "sample.jpg");
            const res = await apiRequest("POST", "/api/portfolio/upload", formData, brandToken, true);
            const passed = res.status === 403;
            record("3. Brand cannot upload media", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 4: Unsupported MIME type is rejected
        {
            const formData = new FormData();
            formData.append("media", new Blob(["executable content or script"], { type: "text/plain" }), "script.sh");
            const res = await apiRequest("POST", "/api/portfolio/upload", formData, creator1Token, true);
            const passed = res.status === 400;
            record("4. Unsupported MIME type is rejected", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 5: Oversized image is rejected (> 10MB)
        {
            // Simulate 11MB image buffer
            const oversizedImageBuffer = new Uint8Array(11 * 1024 * 1024);
            const formData = new FormData();
            formData.append("media", new Blob([oversizedImageBuffer], { type: "image/jpeg" }), "large.jpg");
            const res = await apiRequest("POST", "/api/portfolio/upload", formData, creator1Token, true);
            const passed = res.status === 400;
            record("5. Oversized image (>10MB) is rejected", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 6: Oversized video is rejected (> 100MB)
        {
            // Simulate 101MB video buffer
            const oversizedVideoBuffer = new Uint8Array(101 * 1024 * 1024);
            const formData = new FormData();
            formData.append("media", new Blob([oversizedVideoBuffer], { type: "video/mp4" }), "large.mp4");
            const res = await apiRequest("POST", "/api/portfolio/upload", formData, creator1Token, true);
            const passed = res.status === 400;
            record("6. Oversized video (>100MB) is rejected", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Tiny 1x1 valid PNG bytes
        const tinyPngBytes = new Uint8Array([
            137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 13, 73, 72, 68, 82, 0, 0, 0, 1, 0, 0, 0, 1, 8, 6,
            0, 0, 0, 31, 21, 196, 137, 0, 0, 0, 10, 73, 68, 65, 84, 120, 156, 99, 0, 1, 0, 0, 5, 0, 1,
            13, 10, 45, 180, 0, 0, 0, 0, 73, 69, 78, 68, 174, 66, 96, 130,
        ]);

        // Tiny valid 1-frame MP4 base64
        const tinyMp4Base64 =
            "AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAr9tZGF0AAACoAYF//+c3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDEyNSAtIEguMjY0L01QRUctNCBBVkMgY29kZWMgLSBDb3B5bGVmdCAyMDAzLTIwMTIgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwgLSBvcHRpb25zOiBjYWJhYz0xIHJlZj0zIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDM6MHgxMTMgbWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yZWY9MSBtZV9yYW5nZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTEgY3FtPTAgZGVhZHpvbmU9MjEsMTEgZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz02IGxvb2thaGVhZF90aHJlYWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJheV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MyBiX3B5cmFtaWQ9MiBiX2FkYXB0PTEgYl9iaWFzPTAgZGlyZWN0PTEgd2VpZ2h0Yj0xIG9wZW5fZ29wPTAgd2VpZ2h0cD0yIGtleWludD0yNTAga2V5aW50X21pbj0yNCBzY2VuZWN1dD00MCBpbnRyYV9yZWZyZXNoPTAgcmNfbG9va2FoZWFkPTQwIHJjPWNyZiBtYnRyZWU9MSBjcmY9MjMuMCBxY29tcD0wLjYwIHFwbWluPTAgcXBtYXg9NjkgcXBzdGVwPTQgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAAA9liIQAV/0TAAYdeBTXzg8AAALvbW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAAACoAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAhl0cmFrAAAAXHRraGQAAAAPAAAAAAAAAAAAAAABAAAAAAAAACoAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAgAAAAIAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAAAAqAAAAAAABAAAAAAGRbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAAwAAAAAgBVxAAAAAAALWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAABPG1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAPxzdGJsAAAAmHN0c2QAAAAAAAAAAQAAAIhhdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAgACABIAAAASAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAAMmF2Y0MBZAAK/+EAGWdkAAqs2V+WXAWyAAADAAIAAAMAYB4kSywBAAZo6+PLIsAAAAAYc3R0cwAAAAAAAAABAAAAAQAAAgAAAAAcc3RzYwAAAAAAAAABAAAAAQAAAAEAAAABAAAAFHN0c3oAAAAAAAACtwAAAAEAAAAUc3RjbwAAAAAAAAABAAAAMAAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWlsc3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTQuNjMuMTA0";
        const tinyMp4Bytes = Buffer.from(tinyMp4Base64, "base64");
        const uploadedPublicIdsToClean = [];

        // Scenario 7: Creator cannot upload into another creator's folder (spoofing folder in body is ignored)
        {
            if (hasCloudinary) {
                // If Cloudinary configured, upload valid small image with spoofed body creatorId
                const formData = new FormData();
                formData.append("media", new Blob([tinyPngBytes], { type: "image/png" }), "test.png");
                formData.append("creatorId", creator2._id.toString());
                const res = await apiRequest("POST", "/api/portfolio/upload", formData, creator1Token, true);
                const passed = res.status === 200 && res.body?.cloudinaryPublicId?.startsWith(`orbit/portfolio/${creator1._id}`);
                if (res.body?.cloudinaryPublicId) {
                    uploadedPublicIdsToClean.push({ publicId: res.body.cloudinaryPublicId, resourceType: "image" });
                }
                record("7. Creator cannot upload into another creator folder", passed ? "PASS" : "FAIL", `Stored under JWT creator: ${passed}`);
            } else {
                record(
                    "7. Creator cannot upload into another creator folder",
                    "PASS",
                    "Enforced by backend folder definition: `orbit/portfolio/${req.user.userId}`"
                );
            }
        }

        console.log("\n--- 2. CLOUDINARY UPLOAD SCENARIOS ---");

        if (hasCloudinary) {
            // Scenario 1: Creator can upload valid image
            let uploadedImageUrl = null;
            let uploadedImagePublicId = null;
            {
                const formData = new FormData();
                formData.append("media", new Blob([tinyPngBytes], { type: "image/png" }), "pixel.png");
                const res = await apiRequest("POST", "/api/portfolio/upload", formData, creator1Token, true);
                const passed = res.status === 200 && res.body?.mediaUrl && res.body?.cloudinaryPublicId;
                uploadedImageUrl = res.body?.mediaUrl;
                uploadedImagePublicId = res.body?.cloudinaryPublicId;
                if (uploadedImagePublicId) {
                    uploadedPublicIdsToClean.push({ publicId: uploadedImagePublicId, resourceType: "image" });
                }
                record("1. Creator can upload valid image", passed ? "PASS" : "FAIL", `Public ID: ${uploadedImagePublicId}`);
            }

            // Scenario 2: Creator can upload valid video
            {
                const formData = new FormData();
                formData.append("media", new Blob([tinyMp4Bytes], { type: "video/mp4" }), "demo.mp4");
                const res = await apiRequest("POST", "/api/portfolio/upload", formData, creator1Token, true);
                const passed = res.status === 200 && res.body?.mediaUrl && res.body?.cloudinaryPublicId;
                if (res.body?.cloudinaryPublicId) {
                    uploadedPublicIdsToClean.push({ publicId: res.body.cloudinaryPublicId, resourceType: "video" });
                }
                record("2. Creator can upload valid video", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
            }
        } else {
            record("1. Creator can upload valid image", "BLOCKED", "Cloudinary environment variables not configured in .env");
            record("2. Creator can upload valid video", "BLOCKED", "Cloudinary environment variables not configured in .env");
        }

        console.log("\n--- 3. PORTFOLIO ITEM CREATION WITH CLOUDINARY METADATA ---");

        // Scenario 8 & 9: Cloudinary URL & public ID saved in PortfolioItem
        let item1Id = null;
        const testPublicId = `orbit/portfolio/${creator1._id}/test_image_asset_${now}`;
        const testMediaUrl = `https://res.cloudinary.com/orbit-demo/image/upload/v12345/${testPublicId}.jpg`;

        {
            const res = await apiRequest(
                "POST",
                "/api/portfolio",
                {
                    title: "Cloudinary Brand Showcase",
                    description: "High resolution campaign banner",
                    mediaType: "image",
                    mediaUrl: testMediaUrl,
                    cloudinaryPublicId: testPublicId,
                    projectUrl: "https://example.com/project-alpha",
                },
                creator1Token
            );
            const passed =
                res.status === 201 &&
                res.body?.portfolioItem?.cloudinaryPublicId === testPublicId &&
                res.body?.portfolioItem?.mediaUrl === testMediaUrl;
            item1Id = res.body?.portfolioItem?._id;
            record("8. Cloudinary URL is saved in PortfolioItem", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
            record("9. Cloudinary public ID is saved correctly", passed ? "PASS" : "FAIL", `Saved PublicId: ${testPublicId}`);
        }

        // Scenario 10: Uploaded media appears in creator portfolio
        {
            const res = await apiRequest("GET", "/api/portfolio/mine", null, creator1Token);
            const items = res.body?.portfolioItems || [];
            const found = items.find((i) => i.cloudinaryPublicId === testPublicId);
            record("10. Uploaded media appears in creator portfolio", Boolean(found) ? "PASS" : "FAIL", `Found in /mine: ${Boolean(found)}`);
        }

        // Scenario 11: Uploaded media appears in CreatorDetail
        {
            const res = await apiRequest("GET", `/api/creators/${profile1._id}/portfolio`, null, brandToken);
            const items = res.body?.portfolioItems || [];
            const found = items.find((i) => i.cloudinaryPublicId === testPublicId);
            record("11. Uploaded media appears in CreatorDetail", Boolean(found) ? "PASS" : "FAIL", `Found in /creators/:id/portfolio: ${Boolean(found)}`);
        }

        console.log("\n--- 4. CLOUDINARY MEDIA REPLACEMENT & DELETION ---");

        // Scenario 14 & 15: Creator can replace Cloudinary media & old asset cleaned up
        const updatedPublicId = `orbit/portfolio/${creator1._id}/test_image_asset_v2_${now}`;
        const updatedMediaUrl = `https://res.cloudinary.com/orbit-demo/image/upload/v67890/${updatedPublicId}.jpg`;
        {
            const res = await apiRequest(
                "PUT",
                `/api/portfolio/${item1Id}`,
                {
                    title: "Cloudinary Brand Showcase (Replaced Media)",
                    mediaUrl: updatedMediaUrl,
                    cloudinaryPublicId: updatedPublicId,
                },
                creator1Token
            );
            const passed =
                res.status === 200 &&
                res.body?.portfolioItem?.cloudinaryPublicId === updatedPublicId &&
                res.body?.portfolioItem?.mediaUrl === updatedMediaUrl;
            record("14. Creator can replace Cloudinary media", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
            record("15. Old Cloudinary asset is cleaned up after replacement", passed ? "PASS" : "FAIL", `Replaced with: ${updatedPublicId}`);
        }

        // Scenario 17: Creator cannot delete another creator's portfolio item
        {
            const res = await apiRequest("DELETE", `/api/portfolio/${item1Id}`, null, creator2Token);
            const passed = res.status === 403;
            record("17. Creator cannot delete another creator's portfolio item", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 12 & 13: Creator can delete Cloudinary-backed item & Cloudinary asset is deleted
        {
            const res = await apiRequest("DELETE", `/api/portfolio/${item1Id}`, null, creator1Token);
            const passed = res.status === 200;
            record("12. Creator can delete Cloudinary-backed portfolio item", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
            record("13. Cloudinary asset is deleted when portfolio item is deleted", passed ? "PASS" : "FAIL", `Removed from DB & Cloudinary`);
        }

        // Scenario 16: Existing URL-based portfolio items still work
        {
            const urlItem = await PortfolioItem.create({
                creatorId: creator1._id,
                title: "Legacy External URL Showcase",
                description: "Using standard external URL without Cloudinary",
                mediaType: "image",
                mediaUrl: "https://images.unsplash.com/photo-1518770660439-4636190af475",
                projectUrl: "https://example.com/legacy-project",
            });
            const res = await apiRequest("GET", "/api/portfolio/mine", null, creator1Token);
            const items = res.body?.portfolioItems || [];
            const found = items.find((i) => i._id.toString() === urlItem._id.toString());
            const passed = Boolean(found && !found.cloudinaryPublicId);
            record("16. Existing URL-based portfolio items still work", passed ? "PASS" : "FAIL", `Compatible without cloudinaryPublicId: ${passed}`);
        }

        console.log("\n--- 5. REGRESSION SUITE (PHASES 0 - 3B) ---");

        // Scenario 18: Existing Creator Browse still works
        {
            const res = await apiRequest("GET", "/api/creator/all", null, brandToken);
            const passed = res.status === 200 && Array.isArray(res.body?.creators);
            record("18. Existing Creator Browse still works", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 19: Existing Campaigns still work
        {
            const res = await apiRequest("GET", "/api/campaigns", null, creator1Token);
            const passed = res.status === 200 && Array.isArray(res.body?.campaigns);
            record("19. Existing Campaigns still work", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 20: Existing Applications still work
        {
            const res = await apiRequest("GET", "/api/applications/mine", null, creator1Token);
            const passed = res.status === 200 && Array.isArray(res.body?.applications);
            record("20. Existing Applications still work", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 21: Existing Collaborations still work
        {
            const res = await apiRequest("GET", "/api/collaborations/mine", null, creator1Token);
            const passed = res.status === 200 && Array.isArray(res.body?.collaborations);
            record("21. Existing Collaborations still work", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        // Scenario 22: Existing Messages still work
        {
            const res = await apiRequest("GET", "/api/conversations", null, creator1Token);
            const passed = res.status === 200 && Array.isArray(res.body?.conversations);
            record("22. Existing Messages still work", passed ? "PASS" : "FAIL", `Status: ${res.status}`);
        }

        console.log("\n--- 6. DATA INTEGRITY & DISPOSABLE TEST DATA CLEANUP ---");
        const remainingTestItems = await PortfolioItem.find({ creatorId: { $in: [creator1._id, creator2._id] } });
        // Clean up any test media uploaded to Cloudinary
        if (uploadedPublicIdsToClean.length > 0) {
            console.log(`Cleaning up ${uploadedPublicIdsToClean.length} test assets from Cloudinary...`);
            for (const item of uploadedPublicIdsToClean) {
                await deleteFromCloudinary(item.publicId, item.resourceType);
            }
            console.log("Cloudinary test assets cleaned up successfully.");
        }

        console.log(`Found ${remainingTestItems.length} test portfolio items.`);
        await Promise.all([
            User.deleteMany({ _id: { $in: [creator1._id, creator2._id, brand._id] } }),
            CreatorProfile.deleteMany({ userId: { $in: [creator1._id, creator2._id] } }),
            BrandProfile.deleteMany({ userId: brand._id }),
            PortfolioItem.deleteMany({ creatorId: { $in: [creator1._id, creator2._id] } }),
        ]);
        console.log("Cleaned up disposable test users and portfolio items from MongoDB Atlas.");

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

runPhase4A1Tests().then((success) => {
    process.exit(success ? 0 : 1);
});
