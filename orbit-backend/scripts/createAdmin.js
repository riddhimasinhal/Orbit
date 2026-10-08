const path = require("path");
const readline = require("readline");
const { Writable } = require("stream");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config();

const User = require("../models/User");

/**
 * Creates an input reader supporting both interactive TTY (with masked passwords)
 * and non-interactive piped stdin for scripted provisioning.
 */
function createInputReader() {
    const isTTY = Boolean(process.stdin.isTTY);

    if (!isTTY) {
        const rl = readline.createInterface({ input: process.stdin });
        const iterator = rl[Symbol.asyncIterator]();
        return {
            async ask(query) {
                process.stdout.write(query);
                const next = await iterator.next();
                return (next.value || "").trim();
            },
            close() {
                rl.close();
            },
        };
    }

    // TTY interactive mode with password masking
    let muted = false;
    const mutableStdout = new Writable({
        write: function (chunk, encoding, callback) {
            if (!muted) {
                process.stdout.write(chunk, encoding);
            }
            callback();
        },
    });

    const rl = readline.createInterface({
        input: process.stdin,
        output: mutableStdout,
        terminal: true,
    });

    return {
        ask(query, isSecret = false) {
            return new Promise((resolve) => {
                process.stdout.write(query);
                if (isSecret) muted = true;
                rl.question("", (ans) => {
                    if (isSecret) {
                        muted = false;
                        process.stdout.write("\n");
                    }
                    resolve((ans || "").trim());
                });
            });
        },
        close() {
            rl.close();
        },
    };
}

async function createAdmin() {
    console.log("==========================================");
    console.log("       ORBIT ADMIN PROVISIONING           ");
    console.log("==========================================\n");

    const reader = createInputReader();

    try {
        const name = await reader.ask("Admin name: ");
        if (!name) {
            console.error("\nError: Admin name is required.");
            reader.close();
            process.exit(1);
        }

        const email = await reader.ask("Admin email: ");
        if (!email) {
            console.error("\nError: Admin email is required.");
            reader.close();
            process.exit(1);
        }

        const normalizedEmail = email.toLowerCase().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            console.error("\nError: Please enter a valid email address.");
            reader.close();
            process.exit(1);
        }

        const password = await reader.ask("Admin password: ", true);
        if (!password) {
            console.error("\nError: Admin password is required.");
            reader.close();
            process.exit(1);
        }

        if (password.length < 8) {
            console.error("\nError: Password must be at least 8 characters long.");
            reader.close();
            process.exit(1);
        }

        const confirmPassword = await reader.ask("Confirm password: ", true);
        if (!confirmPassword) {
            console.error("\nError: Password confirmation is required.");
            reader.close();
            process.exit(1);
        }

        if (password !== confirmPassword) {
            console.error("\nError: Passwords do not match.");
            reader.close();
            process.exit(1);
        }

        reader.close();

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

        // Check if user already exists
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
        reader.close();
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
