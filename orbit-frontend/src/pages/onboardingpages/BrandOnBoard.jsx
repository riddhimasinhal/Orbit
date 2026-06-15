
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import axios from "axios"
import { useState } from "react"

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
const CreatorOnBoard = () => {
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
        }
        catch (error) {
            console.log(error);
        }

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
                                onClick={() => setStep(2)}
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
                                onClick={() => setStep(3)}
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
                                onClick={() => setStep(4)}
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

export default CreatorOnBoard
