import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Sparkles } from "lucide-react"
import axios from "axios"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"

const categories = [
    "Tech", "Education", "Fitness", "Fashion",
    "Beauty", "Gaming", "Travel", "Food", "Lifestyle",
];

const CreatorOnBoard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        fullName: "",
        username: "",
        location: "",
        niche: [],
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
    const navigate = useNavigate();

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get("http://localhost:5001/api/creator/profile", {
                    headers: { Authorization: token },
                });

                const { creator, onBoardingCompleted } = response.data;
                if (onBoardingCompleted) {
                    navigate("/creator/dashboard");
                    return;
                }
                setFormData({
                    fullName: creator.fullName || "",
                    username: creator.username || "",
                    location: creator.location || "",
                    niche: creator.niche || [],
                    bio: creator.bio || "",
                    instagramUsername: creator.instagramUsername || "",
                    youtubeUrl: creator.youtubeUrl || "",
                    linkedInUrl: creator.linkedInUrl || "",
                    portfolioUrl: creator.portfolioUrl || "",
                    instagramFollowers: creator.instagramFollowers ?? "",
                    youtubeSubscribers: creator.youtubeSubscribers ?? "",
                    averageViews: creator.averageViews ?? "",
                    audienceCountry: creator.audienceCountry || "",
                });
                if (creator.currentStep && creator.currentStep > 1) {
                    setStep(creator.currentStep);
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
            const response = await axios.post("http://localhost:5001/api/creator/onboarding", formData, {
                headers: { Authorization: token },
            });
            console.log(response.data);
            navigate('/creator/dashboard')
        } catch (error) {
            console.log(error);
        }
    }

    const nextStep = async () => {
        setError("");
        if (step === 1 && !formData.fullName.trim()) {
            setError("Full name is required");
            return;
        }
        try {
            const token = localStorage.getItem("token");
            await axios.put("http://localhost:5001/api/creator/save-step",
                { ...formData, currentStep: step + 1 },
                { headers: { Authorization: token } }
            );
            setStep(step + 1);
        } catch (error) {
            setError(error.response?.data?.message || "Failed to save, Try again.");
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#08080c] flex items-center justify-center">
                <p className="text-zinc-400">Loading your progress...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#08080c] flex items-center justify-center p-6">
            <div className="w-full max-w-xl">
                {/* logo */}
                <div className="flex items-center justify-center gap-2.5 mb-6">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/15 ring-1 ring-violet-500/30">
                        <Sparkles className="size-4 text-violet-300" />
                    </div>
                    <span className="text-lg font-semibold tracking-tight text-white">Orbit</span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
                    <div className="mb-6">
                        <h1 className="text-xl font-semibold text-white">Creator Onboarding</h1>
                        {/* progress bar */}
                        <div className="mt-3 h-1.5 w-full rounded-full bg-white/10">
                            <div
                                className="h-full rounded-full bg-violet-500 transition-all"
                                style={{ width: `${(step / 4) * 100}%` }}
                            />
                        </div>
                        <p className="mt-2 text-xs text-zinc-500">Step {step} of 4</p>
                    </div>

                    {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

                    {step === 1 && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-semibold text-white">Let's build your creator profile</h2>
                                <p className="text-sm text-zinc-500">This information will be visible to brands.</p>
                            </div>
                            <div>
                                <label className="text-sm text-zinc-400 mb-1.5 block">Full Name</label>
                                <Input
                                    placeholder="Your full name"
                                    className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500"
                                    value={formData.fullName}
                                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm text-zinc-400 mb-1.5 block">Location</label>
                                <Input
                                    placeholder="City, Country"
                                    className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500"
                                    value={formData.location}
                                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                />
                            </div>
                            <Button className="w-full bg-violet-600 text-white hover:bg-violet-500" onClick={nextStep}>
                                Continue
                            </Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-semibold text-white">Tell us about your Content</h2>
                                <p className="text-sm text-zinc-500">Select your niches (you can pick multiple).</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {categories.map((category) => (
                                    <button
                                        key={category}
                                        className={`rounded-lg border px-3 py-2 text-sm transition-all ${formData.niche.includes(category)
                                            ? "border-violet-500 bg-violet-500/20 text-violet-300"
                                            : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20"
                                            }`}
                                        onClick={() => {
                                            if (formData.niche.includes(category)) {
                                                setFormData({ ...formData, niche: formData.niche.filter(n => n !== category) })
                                            } else {
                                                setFormData({ ...formData, niche: [...formData.niche, category] })
                                            }
                                        }}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                            <div>
                                <label className="text-sm text-zinc-400 mb-1.5 block">Bio</label>
                                <Textarea
                                    placeholder="Write a short bio..."
                                    className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500"
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-3">
                                <Button variant="outline" className="border-white/10 text-zinc-400 hover:bg-white/5" onClick={() => setStep(step - 1)}>Back</Button>
                                <Button className="flex-1 bg-violet-600 text-white hover:bg-violet-500" onClick={nextStep}>Continue</Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-semibold text-white">Connect your social accounts</h2>
                                <p className="text-sm text-zinc-500">Brands use these links to evaluate creators.</p>
                            </div>
                            <Input placeholder="Instagram Username" className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500" value={formData.instagramUsername} onChange={(e) => setFormData({ ...formData, instagramUsername: e.target.value })} />
                            <Input placeholder="YouTube Channel URL" className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500" value={formData.youtubeUrl} onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value })} />
                            <Input placeholder="LinkedIn Profile URL" className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500" value={formData.linkedInUrl} onChange={(e) => setFormData({ ...formData, linkedInUrl: e.target.value })} />
                            <Input placeholder="Portfolio Website (Optional)" className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500" value={formData.portfolioUrl} onChange={(e) => setFormData({ ...formData, portfolioUrl: e.target.value })} />
                            <div className="flex gap-3">
                                <Button variant="outline" className="border-white/10 text-zinc-400 hover:bg-white/5" onClick={() => setStep(step - 1)}>Back</Button>
                                <Button className="flex-1 bg-violet-600 text-white hover:bg-violet-500" onClick={nextStep}>Continue</Button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-semibold text-white">Tell brands about your audience</h2>
                                <p className="text-sm text-zinc-500">This helps brands find suitable creators.</p>
                            </div>
                            <Input type="number" placeholder="Instagram Followers" className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500" value={formData.instagramFollowers} onChange={(e) => setFormData({ ...formData, instagramFollowers: e.target.value })} />
                            <Input type="number" placeholder="YouTube Subscribers" className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500" value={formData.youtubeSubscribers} onChange={(e) => setFormData({ ...formData, youtubeSubscribers: e.target.value })} />
                            <Input type="number" placeholder="Average Views Per Post" className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500" value={formData.averageViews} onChange={(e) => setFormData({ ...formData, averageViews: e.target.value })} />
                            <Input placeholder="Primary Audience Country" className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500" value={formData.audienceCountry} onChange={(e) => setFormData({ ...formData, audienceCountry: e.target.value })} />
                            <div className="flex gap-3">
                                <Button variant="outline" className="border-white/10 text-zinc-400 hover:bg-white/5" onClick={() => setStep(step - 1)}>Back</Button>
                                <Button className="flex-1 bg-violet-600 text-white hover:bg-violet-500" onClick={handleSubmit}>Complete Profile</Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default CreatorOnBoard
