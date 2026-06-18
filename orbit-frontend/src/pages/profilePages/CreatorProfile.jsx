import { useEffect, useState } from "react"
import axios from "axios"
import { MapPin, AtSign, Play, Link2, Globe } from "lucide-react"

const formatNum = (num) => {
    if (!num) return "—";
    const n = Number(num);
    if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    return n.toString();
}

const CreatorProfile = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await axios.get("http://localhost:5001/api/creator/profile", {
                    headers: { Authorization: token },
                });
                console.log("Creator profile:", res.data);
                setProfile(res.data.creator);
            } catch (error) {
                console.log("Error loading profile", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, []);

    if (loading) return <p className="text-zinc-400">Loading profile...</p>

    return (
        <div className="space-y-6">
            {/* header card */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex items-start gap-4">
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xl font-semibold text-violet-300">
                        {profile?.fullName?.slice(0, 2).toUpperCase() || "CR"}
                    </div>
                    <div className="flex-1">
                        <h1 className="text-2xl font-semibold text-white">{profile?.fullName || "Creator"}</h1>
                        {profile?.username && <p className="text-sm text-violet-400">@{profile.username}</p>}
                        {profile?.location && (
                            <div className="flex items-center gap-1 mt-1 text-sm text-zinc-500">
                                <MapPin className="size-3.5" />
                                {profile.location}
                            </div>
                        )}
                        {profile?.niche?.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-3">
                                {profile.niche.map((n) => (
                                    <span key={n} className="inline-block rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-300">
                                        {n}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                {profile?.bio && (
                    <p className="mt-4 text-sm text-zinc-400 border-t border-white/5 pt-4">{profile.bio}</p>
                )}
            </div>

            {/* stats */}
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
                    <p className="text-2xl font-semibold text-white">{formatNum(profile?.instagramFollowers)}</p>
                    <p className="text-xs text-zinc-500 mt-1">Instagram Followers</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
                    <p className="text-2xl font-semibold text-white">{formatNum(profile?.youtubeSubscribers)}</p>
                    <p className="text-xs text-zinc-500 mt-1">YouTube Subscribers</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
                    <p className="text-2xl font-semibold text-white">{formatNum(profile?.averageViews)}</p>
                    <p className="text-xs text-zinc-500 mt-1">Avg Views Per Post</p>
                </div>
            </div>

            {/* social links */}
            <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
                <h2 className="text-sm font-medium text-zinc-300 mb-4">Social Links</h2>
                <div className="space-y-3">
                    {profile?.instagramUsername && (
                        <div className="flex items-center gap-3">
                            <AtSign className="size-4 text-zinc-500" />
                            <span className="text-sm text-violet-400">@{profile.instagramUsername}</span>
                        </div>
                    )}
                    {profile?.youtubeUrl && (
                        <div className="flex items-center gap-3">
                            <Play className="size-4 text-zinc-500" />
                            <span className="text-sm text-violet-400">{profile.youtubeUrl}</span>
                        </div>
                    )}
                    {profile?.linkedInUrl && (
                        <div className="flex items-center gap-3">
                            <Link2 className="size-4 text-zinc-500" />
                            <span className="text-sm text-violet-400">{profile.linkedInUrl}</span>
                        </div>
                    )}
                    {profile?.portfolioUrl && (
                        <div className="flex items-center gap-3">
                            <Globe className="size-4 text-zinc-500" />
                            <span className="text-sm text-violet-400">{profile.portfolioUrl}</span>
                        </div>
                    )}
                    {!profile?.instagramUsername && !profile?.youtubeUrl && !profile?.linkedInUrl && !profile?.portfolioUrl && (
                        <p className="text-sm text-zinc-600">No social links added yet.</p>
                    )}
                </div>
            </div>
        </div>
    )
}

export default CreatorProfile
