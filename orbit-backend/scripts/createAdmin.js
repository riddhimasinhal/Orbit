const path = require("path");
const readline = require("readline");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config();

const User = require("../models/User");

/**
 * Captures credentials reliably across both interactive Windows PowerShell TTY
 * (with hidden password input via raw mode) and non-interactive piped stdin.
 */
function getCredentials() {
    const isTTY = Boolean(process.stdin.isTTY);

    if (!isTTY) {
        // Non-interactive / piped stdin (e.g. automated test suites)
        const rl = readline.createInterface({ input: process.stdin });
        const iterator = rl[Symbol.asyncIterator]();
        const readLine = async (promptText) => {
            process.stdout.write(promptText);
            const next = await iterator.next();
            return (next.value || "").trim();
        };

        return (async () => {
            const name = await readLine("Admin name: ");
            const email = await readLine("Admin email: ");
            const password = await readLine("Admin password: ");
            const confirmPassword = await readLine("Confirm password: ");
            rl.close();
            return { name, email, password, confirmPassword };
        })();
    }

    // Interactive TTY mode (Windows PowerShell / CMD / Terminal)
    return (async () => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        const name = await new Promise((resolve) => {
            rl.question("Admin name: ", (ans) => resolve((ans || "").trim()));
        });

        const email = await new Promise((resolve) => {
            rl.question("Admin email: ", (ans) => resolve((ans || "").trim()));
        });

        rl.close();

        // Hidden input using process.stdin raw mode
        const askSecret = (promptText) => {
            return new Promise((resolve) => {
                process.stdout.write(promptText);
                let input = "";

                process.stdin.setRawMode(true);
                process.stdin.resume();
                process.stdin.setEncoding("utf8");

                function onData(chunk) {
                    chunk = String(chunk);
                    for (let i = 0; i < chunk.length; i++) {
                        const ch = chunk[i];
                        if (ch === "\r" || ch === "\n" || ch === "\u0004") {
                            process.stdin.setRawMode(false);
                            process.stdin.pause();
                            process.stdin.removeListener("data", onData);
                            process.stdout.write("\n");
                            resolve(input.trim());
                            return;
                        }
                        if (ch === "\u0003") { // Ctrl+C
                            process.stdin.setRawMode(false);
                            process.stdin.pause();
                            process.stdin.removeListener("data", onData);
                            process.stdout.write("\n");
                            process.exit(1);
                        }
                        if (ch === "\u0008" || ch === "\x7f") { // Backspace
                            if (input.length > 0) {
                                input = input.slice(0, -1);
                            }
                            continue;
                        }
                        if (ch >= " " || ch === "\t") {
                            input += ch;
                        }
                    }
                }

                process.stdin.on("data", onData);
            });
        };

        const password = await askSecret("Admin password: ");
        const confirmPassword = await askSecret("Confirm password: ");

        return { name, email, password, confirmPassword };
    })();
}

async function createAdmin() {
    console.log("==========================================");
    console.log("       ORBIT ADMIN PROVISIONING           ");
    console.log("==========================================\n");

    try {
        const { name, email, password, confirmPassword } = await getCredentials();

        if (!name) {
            console.error("\nError: Admin name is required.");
            process.exit(1);
        }

        if (!email) {
            console.error("\nError: Admin email is required.");
            process.exit(1);
        }

        const normalizedEmail = email.toLowerCase().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            console.error("\nError: Please enter a valid email address.");
            process.exit(1);
        }

        if (!password) {
            console.error("\nError: Admin password is required.");
            process.exit(1);
        }

        if (password.length < 8) {
            console.error("\nError: Password must be at least 8 characters long.");
            process.exit(1);
        }

        if (!confirmPassword) {
            console.error("\nError: Password confirmation is required.");
            process.exit(1);
        }

        if (password !== confirmPassword) {
            console.error("\nError: Passwords do not match.");
            process.exit(1);
        }

        // Connect to MongoDB using existing configuration
        const mongoURI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/orbit";
        try {
            await mongoose.connect(mongoURI, {
                dbName: "Orbit",
                serverSelectionTimeoutMS: 5000,
            });
        } catch (connErr) {
            // Local fallback for test environments if Atlas connection times out
            try {
                await mongoose.connect("mongodb://127.0.0.1:27017/Orbit", {
                    serverSelectionTimeoutMS: 5000,
                });
            } catch {
                console.error("\nDatabase connection failed:", connErr.message);
                process.exit(1);
            }
        }

        // Search for existing user by normalized email
        const existingUser = await User.findOne({ email: normalizedEmail });

        if (existingUser) {
            if (existingUser.role === "admin") {
                console.log("\nAn admin with this email already exists.");
            } else {
                console.log("\nA user with this email already exists with another role.");
                console.log("No changes were made.");
            }
            await mongoose.disconnect();
            process.exit(0);
        }

        // Hash password with bcrypt cost factor 10 (matching existing auth)
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create admin user with existing User model
        await User.create({
            name,
            email: normalizedEmail,
            password: hashedPassword,
            role: "admin",
            onBoardingCompleted: true,
        });

        console.log("\n✓ Orbit admin created successfully.\n");
        console.log(`Email: ${normalizedEmail}`);
        console.log("Role: admin\n");
        console.log("You can now log in through the normal Orbit login page.");

        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error("\nUnexpected error:", err.message);
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
        process.exit(1);
    }
}

if (require.main === module) {
    createAdmin();
}

module.exports = { createAdmin };
