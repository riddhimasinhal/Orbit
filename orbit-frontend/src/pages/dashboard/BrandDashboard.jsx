import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import axios from "axios"
import { Building, Globe, Target, Users } from "lucide-react"

const BrandDashboard = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                const response = await axios.get("http://localhost:5001/api/brand/profile", {
                    headers: { Authorization: token },
                });
                console.log("Brand dashboard data:", response.data);
                setProfile(response.data.brand);
            } catch (error) {
                console.log("Failed to fetch profile", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) {
        return <p className="text-zinc-400">Loading dashboard...</p>
    }

    if (!profile) {
        return (
            <div className="space-y-4">
                <h1 className="text-2xl font-semibold text-white">Welcome to Orbit</h1>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
                    <p className="text-zinc-400">Your brand profile isn't set up yet.</p>
                    <Link to="/brand-onboarding" className="inline-block mt-3 text-sm text-violet-400 hover:text-violet-300">Complete Onboarding →</Link>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-semibold text-white">
                    Welcome back{profile?.companyName ? `, ${profile.companyName}` : ""}
                </h1>
                <p className="text-sm text-zinc-500 mt-1">Here's an overview of your brand profile.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-zinc-500">Industry</span>
                        <Building className="size-4 text-violet-400" />
                    </div>
                    <p className="text-xl font-semibold text-white">{profile?.industry || "—"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-zinc-500">Company Size</span>
                        <Users className="size-4 text-violet-400" />
                    </div>
                    <p className="text-xl font-semibold text-white">{profile?.companySize || "—"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-zinc-500">Preferred Niche</span>
                        <Target className="size-4 text-violet-400" />
                    </div>
                    <p className="text-xl font-semibold text-white">{profile?.preferredNiche?.length ? profile.preferredNiche.join(", ") : "—"}</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-zinc-500">Target Country</span>
                        <Globe className="size-4 text-violet-400" />
                    </div>
                    <p className="text-xl font-semibold text-white">{profile?.targetCountry || "—"}</p>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                    <h2 className="text-sm font-medium text-zinc-300 mb-4">Company Info</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-zinc-500">Company Name</span>
                            <span className="text-sm text-white">{profile?.companyName || "Not set"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-zinc-500">Website</span>
                            <span className="text-sm text-violet-400">{profile?.website || "Not set"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-zinc-500">Location</span>
                            <span className="text-sm text-white">{profile?.location || "Not set"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-zinc-500">Budget Range</span>
                            <span className="text-sm text-white">{profile?.budgetRange || "Not set"}</span>
                        </div>
                    </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                    <h2 className="text-sm font-medium text-zinc-300 mb-4">Contact Info</h2>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-sm text-zinc-500">Contact Person</span>
                            <span className="text-sm text-white">{profile?.contactPerson || "Not set"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-zinc-500">Contact Email</span>
                            <span className="text-sm text-violet-400">{profile?.contactEmail || "Not set"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-zinc-500">Instagram</span>
                            <span className="text-sm text-violet-400">{profile?.instagramPage || "Not linked"}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-zinc-500">LinkedIn</span>
                            <span className="text-sm text-violet-400">{profile?.linkedInPage || "Not linked"}</span>
                        </div>
                    </div>
                </div>
            </div>

            {profile?.description && (
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                    <h2 className="text-sm font-medium text-zinc-300 mb-3">Brand Description</h2>
                    <p className="text-sm text-zinc-400">{profile.description}</p>
                </div>
            )}
        </div>
    )
}

export default BrandDashboard
