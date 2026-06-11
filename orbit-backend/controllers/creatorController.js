const CreatorProfile = require("../models/CreatorProfile");
const User = require("../models/User");
const createCreatorProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        console.log("REQ USER:", req.user);
        console.log("REQ BODY:", req.body);
        const creator =
            await CreatorProfile.create({
                userId,
                ...req.body,
            });
        await User.findByIdAndUpdate(
            userId,
            {
                onBoardingCompleted: true,
            });
        // console.log("USER:");
        // console.log(req.user);
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
module.exports = {
    createCreatorProfile,
};