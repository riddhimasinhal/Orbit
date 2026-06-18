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

const BrandOnBoard = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
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
        preferredNiche: [],
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
                const response = await axios.get("http://localhost:5001/api/brand/profile", {
                    headers: { Authorization: token },
                });

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
                    preferredNiche: brand.preferredNiche || [],
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
            const response = await axios.post("http://localhost:5001/api/brand/onboarding", formData, {
                headers: { Authorization: token },
            });
            console.log(response.data);
            navigate('/brand/dashboard')
        } catch (error) {
            console.log(error);
        }
    }

    const nextStep = async () => {
        setError("");
        if (step === 1 && !formData.companyName.trim()) {
            setError("Company name is required");
            return;
        }
        try {
            const token = localStorage.getItem("token");
            await axios.put("http://localhost:5001/api/brand/save-step",
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
                <div className="flex items-center justify-center gap-2.5 mb-6">
                    <div className="flex size-8 items-center justify-center rounded-lg bg-violet-500/15 ring-1 ring-violet-500/30">
                        <Sparkles className="size-4 text-violet-300" />
                    </div>
                    <span className="text-lg font-semibold tracking-tight text-white">Orbit</span>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
                    <div className="mb-6">
                        <h1 className="text-xl font-semibold text-white">Brand Onboarding</h1>
                        <div className="mt-3 h-1.5 w-full rounded-full bg-white/10">
                            <div className="h-full rounded-full bg-violet-500 transition-all" style={{ width: `${(step / 4) * 100}%` }} />
                        </div>
                        <p className="mt-2 text-xs text-zinc-500">Step {step} of 4</p>
                    </div>

                    {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

                    {step === 1 && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-semibold text-white">Let's build your brand profile</h2>
                                <p className="text-sm text-zinc-500">This information will help creators discover your brand.</p>
                            </div>
                            <Input placeholder="Company Name" className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500" value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} />
                            <Input placeholder="Industry" className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500" value={formData.industry} onChange={(e) => setFormData({ ...formData, industry: e.target.value })} />
                            <Input placeholder="Company Size" className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500" value={formData.companySize} onChange={(e) => setFormData({ ...formData, companySize: e.target.value })} />
                            <Input placeholder="Website URL" className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
                            <Input placeholder="Headquarters Location" className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} />
                            <Button className="w-full bg-violet-600 text-white hover:bg-violet-500" onClick={nextStep}>Continue</Button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-semibold text-white">Tell creators about your brand</h2>
                                <p className="text-sm text-zinc-500">Help creators understand your company.</p>
                            </div>
                            <Textarea placeholder="Brand Description" className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                            <Textarea placeholder="Target Audience" className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500" value={formData.targetAudience} onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })} />
                            <Textarea placeholder="Marketing Goals" className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500" value={formData.marketingGoals} onChange={(e) => setFormData({ ...formData, marketingGoals: e.target.value })} />
                            <div className="flex gap-3">
                                <Button variant="outline" className="border-white/10 text-zinc-400 hover:bg-white/5" onClick={() => setStep(1)}>Back</Button>
                                <Button className="flex-1 bg-violet-600 text-white hover:bg-violet-500" onClick={nextStep}>Continue</Button>
                            </div>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-semibold text-white">What creators are you looking for?</h2>
                                <p className="text-sm text-zinc-500">Select preferred niches (you can pick multiple).</p>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {categories.map((category) => (
                                    <button
                                        key={category}
                                        className={`rounded-lg border px-3 py-2 text-sm transition-all ${formData.preferredNiche.includes(category)
                                            ? "border-violet-500 bg-violet-500/20 text-violet-300"
                                            : "border-white/10 bg-white/5 text-zinc-400 hover:border-white/20"
                                            }`}
                                        onClick={() => {
                                            if (formData.preferredNiche.includes(category)) {
                                                setFormData({ ...formData, preferredNiche: formData.preferredNiche.filter(n => n !== category) })
                                            } else {
                                                setFormData({ ...formData, preferredNiche: [...formData.preferredNiche, category] })
                                            }
                                        }}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                            <Input placeholder="Preferred Platform (Instagram, YouTube, LinkedIn)" className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500" value={formData.preferredPlatform} onChange={(e) => setFormData({ ...formData, preferredPlatform: e.target.value })} />
                            <Input placeholder="Budget Range" className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500" value={formData.budgetRange} onChange={(e) => setFormData({ ...formData, budgetRange: e.target.value })} />
                            <div className="flex gap-3">
                                <Button variant="outline" className="border-white/10 text-zinc-400 hover:bg-white/5" onClick={() => setStep(step - 1)}>Back</Button>
                                <Button className="flex-1 bg-violet-600 text-white hover:bg-violet-500" onClick={nextStep}>Continue</Button>
                            </div>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="space-y-4">
                            <div>
                                <h2 className="text-lg font-semibold text-white">Contact & Campaign Details</h2>
                                <p className="text-sm text-zinc-500">Help creators reach your brand.</p>
                            </div>
                            <Input placeholder="Business Email" className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500" value={formData.contactEmail} onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })} />
                            <Input placeholder="Contact Person" className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500" value={formData.contactPerson} onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })} />
                            <Input placeholder="Instagram Brand Page" className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500" value={formData.instagramPage} onChange={(e) => setFormData({ ...formData, instagramPage: e.target.value })} />
                            <Input placeholder="LinkedIn Company Page" className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500" value={formData.linkedInPage} onChange={(e) => setFormData({ ...formData, linkedInPage: e.target.value })} />
                            <Input placeholder="Campaign Frequency" className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500" value={formData.campaignFrequency} onChange={(e) => setFormData({ ...formData, campaignFrequency: e.target.value })} />
                            <Input placeholder="Target Country" className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500" value={formData.targetCountry} onChange={(e) => setFormData({ ...formData, targetCountry: e.target.value })} />
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

export default BrandOnBoard
