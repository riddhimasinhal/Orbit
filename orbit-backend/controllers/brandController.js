const BrandProfile = require("../models/BrandProfile");
const User = require("../models/User");

const createBrandProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        console.log("REQ USER:", req.user);
        console.log("REQ BODY:", req.body);

        const brand = await BrandProfile.create({
            userId,
            ...req.body,
        });

        await User.findByIdAndUpdate(
            userId,
            {
                onboardingCompleted: true,
            }
        );

        res.status(201).json({
            success: true,
            message: "Brand Profile Created Successfully",
            brand,
        });

    } catch (error) {
        console.log(error);

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

module.exports = {
    createBrandProfile,
};