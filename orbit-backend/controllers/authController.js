const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const BrandProfile = require("../models/BrandProfile");
const CreatorProfile = require("../models/CreatorProfile");

const signup = async (req, res) => {
    try {

        const { name, email, password, confirmPass, role } = req.body;
        if (!name || !email || !password || !confirmPass || !role) {
            return res.status(400).json({
                message: "All fields are required",
            })
        }
        if (!["creator", "brand"].includes(role)) {
            return res.status(400).json({
                message: "Invalid role. Role must be 'creator' or 'brand'",
            });
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                message: "Please enter a valid email",
            });
        }
        if (password.length < 8) {
            return res.status(400).json({
                message: "Password must be at least 8 characters"
            });
        }
        if (password !== confirmPass) {
            return res.status(400).json({
                message: "Passwords do not match",
            })
        }
        const existingUser = await User.findOne({
            email,
        });
        if (existingUser) {
            return res.status(400).json({
                message: "User already exists",
            })
        }
        const hashedPass = await bcrypt.hash(password, 10);
        console.log("Signup request received for email:", email);
        const user = await User.create({
            name,
            email,
            password: hashedPass,
            role,
        });
        if (role === "creator") {
            await CreatorProfile.create({
                userId: user._id,
                currentStep: 1,
            });
        }
        else {
            await BrandProfile.create({
                userId: user._id,
                currentStep: 1,
            });
        }



        res.status(201).json({
            success: true,
            message: "Account created successfully"
        })
        // console.log(req.body);

        // res.json({
        //     message: "Received data successfully",
        // });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: "User with this email already exists",
            });
        }
        console.error("Signup error:", error.message);
        res.status(500).json({
            message: error.message || "Something went wrong",
        });
    }
};
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({
                message: "Email and Password are required",
            });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({
                message: "User not found",
            })
        }
        const isMatch = await bcrypt.compare(
            password,
            user.password
        );
        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid Credentials",
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET environment variable is not defined");
        }

        const token = jwt.sign(
            {
                userId: user._id,
                role: user.role,
                onBoardingCompleted: user.onBoardingCompleted,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            role: user.role,
            onBoardingCompleted: user.onBoardingCompleted,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message,
        });
    }
}
module.exports = { signup, login };



