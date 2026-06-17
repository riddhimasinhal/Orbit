const CreatorProfile = require("../models/CreatorProfile");
const User = require("../models/User");
const createCreatorProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        // console.log("REQ USER:", req.user);
        // console.log("REQ BODY:", req.body);
        const creator =
            await CreatorProfile.findOneAndUpdate(
                { userId },
                { ...req.body },
                { new: true });
        await User.findByIdAndUpdate(
            userId,
            {
                onBoardingCompleted: true,
            });

        res.status(201).json({
            message: "Creator Profile Created",
            creator,
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: error.message,
        });
    }
}
const getCreatorProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        const creator = await CreatorProfile.findOne({
            userId,
        })

        if (!creator) {
            return res.status(404).json({
                message: "Profile not found",
            });

        }
        res.status(200).json({
            creator,
            onBoardingCompleted: req.user?.onBoardingCompleted ?? false,
        })
    }
    catch (error) {
        console.log("error", error)
        res.status(500).json({
            message: error.message,
        });
    }
}
const updateCreatorProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        console.log("SAVE-STEP BODY:", req.body);
        console.log("SAVE-STEP KEYS:", Object.keys(req.body));
        console.log("niche:", req.body.niche, "bio:", req.body.bio);
        // const { currentStep, fullName, location } = req.body;
        if (req.body.currentStep === 2 && !req.body.fullName?.trim()) {
            return res.status(400).json({
                message: "Full name is required",
            })
        }
        //this is validation for required fullName
        const profile = await CreatorProfile.findOneAndUpdate(
            { userId },
            { ...req.body },
            { new: true }

        );
        //if profile gives null then return 
        if (!profile) {
            return res.status(404).json({
                message: "Profile not found"
            });
        }

        console.log({ userId, profile });
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
    createCreatorProfile,
    getCreatorProfile,
    updateCreatorProfile,
};