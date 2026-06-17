const BrandProfile = require("../models/BrandProfile");
const User = require("../models/User");

const createBrandProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        // console.log("REQ USER:", req.user);
        // console.log("REQ BODY:", req.body);

        const brand = await BrandProfile.findOneAndUpdate(
            { userId },
            { ...req.body },
            { new: true }

        );

        await User.findByIdAndUpdate(
            userId,
            {
                onBoardingCompleted: true,
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
const getBrandProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        const brand = await BrandProfile.findOne({
            userId,
        })

        if (!brand) {
            return res.status(404).json({
                message: "Profile not found",
            });

        }
        res.status(200).json({
            brand,
            onBoardingCompleted: req.user?.onBoardingCompleted ?? false,
        })
    }
    catch (error) {
        console.log("error", error)
        res.status(500).json({
            message: error.message,
        });
    }
};
const updateBrandProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        if (req.body.currentStep === 2 && !req.body.companyName.trim()) {
            return res.status(400).json({
                message: "Company name is required",
            })
        }
        const profile = await BrandProfile.findOneAndUpdate(
            { userId },
            { ...req.body },
            { new: true },
        )
        if (!profile) {
            return res.status(404).json({
                message: "Profile not found"
            });
        }
        res.status(200).json({
            message: "Step saved",
            profile,
        })
    }
    catch (error) {
        res.status(500).json({
            message: error.message,
        })
    }
}
module.exports = {
    createBrandProfile,
    updateBrandProfile,
    getBrandProfile
};