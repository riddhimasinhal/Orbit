const CreatorProfile = require("../models/CreatorProfile");
const User = require("../models/User");
const createCreatorProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        // console.log("REQ USER:", req.user);
        // console.log("REQ BODY:", req.body);
        const { fullName, username, location, niche, bio, instagramUsername, youtubeUrl, linkedInUrl, portfolioUrl, instagramFollowers, youtubeSubscribers, averageViews, audienceCountry } = req.body;

        const creator =
            await CreatorProfile.findOneAndUpdate(
                { userId },
                { fullName, username, location, niche, bio, instagramUsername, youtubeUrl, linkedInUrl, portfolioUrl, instagramFollowers, youtubeSubscribers, averageViews, audienceCountry },
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
        const user = await User.findById(userId);
        res.status(200).json({
            creator,
            onBoardingCompleted: user?.onBoardingCompleted ?? false,
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
        const { currentStep, fullName, username, location, niche, bio, instagramUsername, youtubeUrl, linkedInUrl, portfolioUrl, instagramFollowers, youtubeSubscribers, averageViews, audienceCountry } = req.body;

        const profile = await CreatorProfile.findOneAndUpdate(
            { userId },
            { currentStep, fullName, username, location, niche, bio, instagramUsername, youtubeUrl, linkedInUrl, portfolioUrl, instagramFollowers, youtubeSubscribers, averageViews, audienceCountry },
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
const getAllCreators = async (req, res) => {
    try {
        const { search, niche } = req.query;
        let filter = {};

        if (niche) {
            filter.niche = niche;
        }
        if (search) {
            filter.$or = [
                { fullName: { $regex: search, $options: "i" } },
                { username: { $regex: search, $options: "i" } },
                { location: { $regex: search, $options: "i" } },
            ];
        }

        const creators = await CreatorProfile.find(filter);
        console.log("Found creators:", creators.length);
        res.status(200).json({ creators });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}
const getCreatorById = async (req, res) => {
    try {
        const creator = await CreatorProfile.findById(req.params.id);
        if (!creator) {
            return res.status(404).json({ message: "Creator not found" })
        }
        console.log("Found creator by id:", creator.fullName);
        res.status(200).json({ creator });
    }
    catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}

module.exports = {
    createCreatorProfile,
    getCreatorProfile,
    updateCreatorProfile,
    getAllCreators,
    getCreatorById,
};