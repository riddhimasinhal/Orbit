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
        fullName: "",
        username: "",
        location: "",
        niche: "",
        bio: "",
        instagramUsername: "",
        youtubeUrl: "",
        linkedInUrl: "",
        portfolioUrl: "",
        instagramFollowers: "",
        youtubeSubscribers: "",
        averageViews: "",
        audienceCountry: "",
    });
    // const token = localStorage.getItem("token");
    const handleSubmit = async () => {
        try {
            const token = localStorage.getItem("token");

            console.log("TOKEN SENT:", token);
            const response = await axios.post("http://localhost:5000/api/creator/onboarding", formData,
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
                        Creator Onboarding
                    </CardTitle>
                    <Progress value={(step / 4) * 100} />
                </CardHeader>
                <CardContent>
                    {step === 1 && (
                        <div className="space-y-5">
                            <div>
                                <h2 className="text-2xl font-bold">
                                    Let's build your creator profile
                                </h2>

                                <p className="text-muted-foreground">
                                    This information will be visible to brands.
                                </p>
                            </div>

                            <Input placeholder="Full Name" required value={formData.fullName} onChange={(e) => setFormData({
                                ...formData,
                                fullName: e.target.value,
                            })} />

                            <Input placeholder="Username" required value={formData.username} onChange={(e) => setFormData({
                                ...formData,
                                username: e.target.value,
                            })} />

                            <Input placeholder="Location" required value={formData.location} onChange={(e) => setFormData({
                                ...formData,
                                location: e.target.value,
                            })} />

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
                                    Tell us about your Content
                                </h2>
                                <p className="text-muted-foreground">
                                    Select your Primary niche.
                                </p>
                            </div>
                            <div className="grid grid-cols-3 gap-3">

                                {categories.map((category) => (
                                    <Button
                                        key={category}
                                        variant={
                                            formData.niche === category
                                                ? "default"
                                                : "outline"
                                        }

                                        onClick={() => setFormData({
                                            ...formData,
                                            niche: category,
                                        })}
                                    >
                                        {category}
                                    </Button>
                                ))}

                            </div>
                            <Textarea placeholder="Write a short bio..." value={formData.bio} onChange={(e) => setFormData({
                                ...formData,
                                bio: e.target.value,
                            })} />
                            <Button
                                variant="outline"
                                onClick={() => setStep(step - 1)}
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
                                    Connect your social accounts
                                </h2>

                                <p className="text-muted-foreground">
                                    Brands use these links to evaluate creators.
                                </p>
                            </div>

                            <Input placeholder="Instagram Username" value={formData.instagramUsername} onChange={(e) => setFormData({
                                ...formData,
                                instagramUsername: e.target.value,
                            })} />

                            <Input placeholder="YouTube Channel URL" value={formData.youtubeUrl} onChange={(e) => setFormData({
                                ...formData,
                                youtubeUrl: e.target.value,
                            })} />

                            <Input placeholder="LinkedIn Profile URL" value={formData.linkedInUrl} onChange={(e) => setFormData({
                                ...formData,
                                linkedInUrl: e.target.value,
                            })} />

                            <Input placeholder="Portfolio Website (Optional)" value={formData.portfolioUrl} onChange={(e) => setFormData({
                                ...formData,
                                portfolioUrl: e.target.value,
                            })} />
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
                                    Tell brands about your audience
                                </h2>

                                <p className="text-muted-foreground">
                                    This helps brands find suitable creators.
                                </p>
                            </div>

                            <Input
                                placeholder="Instagram Followers" value={formData.instagramFollowers} onChange={(e) => setFormData({
                                    ...formData,
                                    instagramFollowers: e.target.value,
                                })}
                            />

                            <Input
                                placeholder="YouTube Subscribers" value={formData.youtubeSubscribers} onChange={(e) => setFormData({
                                    ...formData,
                                    youtubeSubscribers: e.target.value,
                                })}
                            />

                            <Input
                                placeholder="Average Views Per Post" value={formData.averageViews} onChange={(e) => setFormData({
                                    ...formData,
                                    averageViews: e.target.value,
                                })}
                            />

                            <Input
                                placeholder="Primary Audience Country" value={formData.audienceCountry} onChange={(e) => setFormData({
                                    ...formData,
                                    audienceCountry: e.target.value,
                                })}
                            />
                            <Button
                                variant="outline"
                                onClick={() => setStep(step - 1)}
                            >
                                Back
                            </Button>
                            <Button className="w-full" onClick={
                                handleSubmit
                            }>
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
