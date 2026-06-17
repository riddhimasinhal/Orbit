
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import axios from "axios"
import { useState , useEffect} from "react"
import { useNavigate } from "react-router-dom"

const categories = [
    "Tech",
    "Education",
    "Fitness",
    "Fashion",
    "Beauty",
    "Gaming",
    "Travel",
    "Food",
    "Lifestyle",
];
const BrandOnBoard = () => {
    const navigate = useNavigate();
    const [loading , setLoading]= useState(true);
    const [ error, setError]= useState("");
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        companyName: "",
        industry: "",
        companySize: "",
        website: "",
        location: "",

        description: "",
        targetAudience: "",
        marketingGoals: "",
        preferredNiche: "",

        instagramPage: "",
        linkedInPage: "",
        contactEmail: "",
        contactPerson: "",

        budgetRange: "",
        preferredPlatform: "",
        campaignFrequency: "",
        targetCountry: "",
    });
    useEffect(() => {
        const loadProfile = async () => {
            try {
                const token = localStorage.getItem("token");

                const response = await axios.get(
                    "http://localhost:5000/api/brand/profile",
                    {
                        headers: {
                            Authorization: token,
                        },
                    }
                );

                const { brand, onBoardingCompleted } = response.data;

                if (onBoardingCompleted) {
                    navigate("/brand/dashboard");
                    return;
                }

                setFormData({
                    companyName: brand.companyName || "",
                    industry: brand.industry || "",
                    companySize: brand.companySize || "",
                    website: brand.website || "",
                    location: brand.location || "",
                    description: brand.description || "",
                    targetAudience: brand.targetAudience || "",
                    marketingGoals: brand.marketingGoals || "",
                    preferredNiche: brand.preferredNiche || "",
                    instagramPage: brand.instagramPage || "",
                    linkedInPage: brand.linkedInPage || "",
                    contactEmail: brand.contactEmail || "",
                    contactPerson: brand.contactPerson || "",
                    budgetRange: brand.budgetRange || "",
                    preferredPlatform: brand.preferredPlatform || "",
                    campaignFrequency: brand.campaignFrequency || "",
                    targetCountry: brand.targetCountry || "",
                });

                if (brand.currentStep && brand.currentStep > 1) {
                    setStep(brand.currentStep);
                }
            } catch (error) {
                console.log("Failed to load profile:", error);
            } finally {
                setLoading(false);
            }
        };

        loadProfile();
    }, [navigate]);
    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem("token");

            console.log("TOKEN SENT:", token);
            const response = await axios.post("http://localhost:5000/api/brand/onboarding", formData,
                {
                    headers: {
                        Authorization: token,
                    },
                }
            );
            console.log(response.data);
            navigate('/brand/dashboard')
        }
        catch (error) {
            console.log(error);
        }

    }
    const nextStep = async () => {
        setError("");
     if(step === 1 && !formData.companyName.trim()){
        setError("Company name is required");
        return;
    }
    try{
        const token = localStorage.getItem("token");

        await axios.put(
            "http://localhost:5000/api/brand/save-step",
            {
                ...formData,
                currentStep: step + 1,
            },
            {
                headers: {
                    Authorization: token,
                },
            }
        );

        setStep(step + 1);
    }catch(error){
        setError(
            error.response?.data?.message||"Failed to save , Try again."
        );
    }
    };
    if (loading) {
        return (
            <div className="min-h-screen bg-[#0F0B1F] flex items-center justify-center">
                <p className="text-white">Loading your progress...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F0B1F] flex items-center justify-center p-6">
            <Card className="w-full max-w-xl" >
                <CardHeader>
                    <CardTitle>
                        Brand Onboarding
                    </CardTitle>
                    <Progress value={(step / 4) * 100} />
                </CardHeader>
                <CardContent>
                {error && <p className="text-red-500 text-sm">{error}</p> }
                    {step === 1 && (
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-2xl font-bold">
                                    Let's build your brand profile
                                </h2>

                                <p className="text-muted-foreground">
                                    This information will help creators discover your brand.
                                </p>
                            </div>

                            <Input
                                placeholder="Company Name"
                                value={formData.companyName}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        companyName: e.target.value,
                                    })
                                }
                            />

                            <Input
                                placeholder="Industry"
                                value={formData.industry}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        industry: e.target.value,
                                    })
                                }
                            />

                            <Input
                                placeholder="Company Size"
                                value={formData.companySize}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        companySize: e.target.value,
                                    })
                                }
                            />

                            <Input
                                placeholder="Website URL"
                                value={formData.website}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        website: e.target.value,
                                    })
                                }
                            />

                            <Input
                                placeholder="Headquarters Location"
                                value={formData.location}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        location: e.target.value,
                                    })
                                }
                            />

                            <Button
                                className="w-full"
                                onClick={nextStep}
                            >
                                Continue
                            </Button>
                        </div>
                    )}
                    {step === 2 && (
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-2xl font-bold">
                                    Tell creators about your brand
                                </h2>

                                <p className="text-muted-foreground">
                                    Help creators understand your company.
                                </p>
                            </div>

                            <Textarea
                                placeholder="Brand Description"
                                value={formData.description}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        description: e.target.value,
                                    })
                                }
                            />

                            <Textarea
                                placeholder="Target Audience"
                                value={formData.targetAudience}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        targetAudience: e.target.value,
                                    })
                                }
                            />

                            <Textarea
                                placeholder="Marketing Goals"
                                value={formData.marketingGoals}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        marketingGoals: e.target.value,
                                    })
                                }
                            />

                            <Button
                                variant="outline"
                                onClick={() => setStep(1)}
                            >
                                Back
                            </Button>

                            <Button
                                className="w-full"
                                onClick={nextStep}
                            >
                                Continue
                            </Button>
                        </div>
                    )}
                    {step === 3 && (
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-2xl font-bold">
                                    What creators are you looking for?
                                </h2>

                                <p className="text-muted-foreground">
                                    Select your preferred creator niche.
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                {categories.map((category) => (
                                    <Button
                                        key={category}
                                        variant={
                                            formData.preferredNiche === category
                                                ? "default"
                                                : "outline"
                                        }
                                        onClick={() =>
                                            setFormData({
                                                ...formData,
                                                preferredNiche: category,
                                            })
                                        }
                                    >
                                        {category}
                                    </Button>
                                ))}
                            </div>

                            <Input
                                placeholder="Preferred Platform (Instagram, YouTube, LinkedIn)"
                                value={formData.preferredPlatform}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        preferredPlatform: e.target.value,
                                    })
                                }
                            />

                            <Input
                                placeholder="Budget Range"
                                value={formData.budgetRange}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        budgetRange: e.target.value,
                                    })
                                }
                            />

                            <Button
                                variant="outline"
                                onClick={() => setStep(step - 1)}
                            >
                                Back
                            </Button>

                            <Button
                                className="w-full"
                                onClick={nextStep}
                            >
                                Continue
                            </Button>
                        </div>
                    )}
                    {step === 4 && (
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-2xl font-bold">
                                    Contact & Campaign Details
                                </h2>

                                <p className="text-muted-foreground">
                                    Help creators reach your brand.
                                </p>
                            </div>

                            <Input
                                placeholder="Business Email"
                                value={formData.contactEmail}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        contactEmail: e.target.value,
                                    })
                                }
                            />

                            <Input
                                placeholder="Contact Person"
                                value={formData.contactPerson}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        contactPerson: e.target.value,
                                    })
                                }
                            />

                            <Input
                                placeholder="Instagram Brand Page"
                                value={formData.instagramPage}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        instagramPage: e.target.value,
                                    })
                                }
                            />

                            <Input
                                placeholder="LinkedIn Company Page"
                                value={formData.linkedInPage}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        linkedInPage: e.target.value,
                                    })
                                }
                            />

                            <Input
                                placeholder="Campaign Frequency"
                                value={formData.campaignFrequency}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        campaignFrequency: e.target.value,
                                    })
                                }
                            />

                            <Input
                                placeholder="Target Country"
                                value={formData.targetCountry}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        targetCountry: e.target.value,
                                    })
                                }
                            />

                            <Button
                                variant="outline"
                                onClick={() => setStep(step - 1)}
                            >
                                Back
                            </Button>

                            <Button
                                className="w-full"
                                onClick={handleSubmit}
                            >
                                Complete Profile
                            </Button>
                        </div>
                    )}


                </CardContent>
            </Card>

        </div >
    )
}

export default BrandOnBoard
