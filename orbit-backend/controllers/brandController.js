const BrandProfile = require("../models/BrandProfile");
const User = require("../models/User");

const createBrandProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        // console.log("REQ USER:", req.user);
        // console.log("REQ BODY:", req.body);

        const { companyName, industry, companySize, website, location, description, targetAudience, marketingGoals, preferredNiche, instagramPage, linkedInPage, contactEmail, contactPerson, budgetRange, preferredPlatform, campaignFrequency, targetCountry } = req.body;

        const brand = await BrandProfile.findOneAndUpdate(
            { userId },
            { companyName, industry, companySize, website, location, description, targetAudience, marketingGoals, preferredNiche, instagramPage, linkedInPage, contactEmail, contactPerson, budgetRange, preferredPlatform, campaignFrequency, targetCountry },
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
        const user = await User.findById(userId);
        res.status(200).json({
            brand,
            onBoardingCompleted: user?.onBoardingCompleted ?? false,
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
        if (req.body.currentStep === 2 && !req.body.companyName?.trim()) {
            return res.status(400).json({
                message: "Company name is required",
            })
        }
        const { currentStep, companyName, industry, companySize, website, location, description, targetAudience, marketingGoals, preferredNiche, instagramPage, linkedInPage, contactEmail, contactPerson, budgetRange, preferredPlatform, campaignFrequency, targetCountry } = req.body;

        const profile = await BrandProfile.findOneAndUpdate(
            { userId },
            { currentStep, companyName, industry, companySize, website, location, description, targetAudience, marketingGoals, preferredNiche, instagramPage, linkedInPage, contactEmail, contactPerson, budgetRange, preferredPlatform, campaignFrequency, targetCountry },
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
const getAllBrands = async (req, res) => {
    try {
        const { search, niche, industry } = req.query;
        let filter = {};

        if (niche) {
            filter.preferredNiche = niche;
        }
        if (industry) {
            filter.industry = { $regex: industry, $options: "i" };
        }
        if (search) {
            filter.$or = [
                { companyName: { $regex: search, $options: "i" } },
                { industry: { $regex: search, $options: "i" } },
                { location: { $regex: search, $options: "i" } },
            ];
        }

        const brands = await BrandProfile.find(filter);
        console.log("Found brands:", brands.length);
        res.status(200).json({ brands });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
}
const getBrandById = async (req, res) => {
    try {
        const brand = await BrandProfile.findById(req.params.id);
        if (!brand) {
            return res.status(404).json({ message: "Brand not found" })
        }
        console.log("Found brand by id:", brand.companyName);
        res.status(200).json({ brand })
    }
    catch (error) {
        console.log(error)
        res.status(500).json({ message: error.message })
    }
}

module.exports = {
    createBrandProfile,
    updateBrandProfile,
    getBrandProfile,
    getAllBrands,
    getBrandById,
};