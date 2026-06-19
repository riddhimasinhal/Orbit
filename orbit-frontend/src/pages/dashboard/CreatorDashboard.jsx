import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { Users, TrendingUp, Eye, AtSign } from "lucide-react";

const formatNum = (num) => {
  if (!num) return "—";
  const n = Number(num);
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
};

const CreatorDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          "http://13.239.47.56:5001/api/creator/profile",
          {
            headers: { Authorization: token },
          },
        );
        console.log("Dashboard data:", response.data);
        setProfile(response.data.creator);
      } catch (error) {
        console.log("Failed to fetch profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return <p className="text-zinc-400">Loading dashboard...</p>;
  }

  if (!profile) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold text-white">Welcome to Orbit</h1>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center">
          <p className="text-zinc-400">Your profile isn't set up yet.</p>
          <Link
            to="/creator-onboarding"
            className="inline-block mt-3 text-sm text-violet-400 hover:text-violet-300"
          >
            Complete Onboarding →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          Welcome back{profile?.fullName ? `, ${profile.fullName}` : ""}
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Here's an overview of your creator profile.
        </p>
      </div>

      {/* stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500">Instagram Followers</span>
            <AtSign className="size-4 text-violet-400" />
          </div>
          <p className="text-xl font-semibold text-white">
            {formatNum(profile?.instagramFollowers)}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500">YouTube Subscribers</span>
            <Users className="size-4 text-violet-400" />
          </div>
          <p className="text-xl font-semibold text-white">
            {formatNum(profile?.youtubeSubscribers)}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500">Average Views</span>
            <Eye className="size-4 text-violet-400" />
          </div>
          <p className="text-xl font-semibold text-white">
            {formatNum(profile?.averageViews)}
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-zinc-500">Niche</span>
            <TrendingUp className="size-4 text-violet-400" />
          </div>
          <p className="text-xl font-semibold text-white">
            {profile?.niche?.length ? profile.niche.join(", ") : "—"}
          </p>
        </div>
      </div>

      {/* profile overview  */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-sm font-medium text-zinc-300 mb-4">
            Profile Info
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">Full Name</span>
              <span className="text-sm text-white">
                {profile?.fullName || "Not set"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">Username</span>
              <span className="text-sm text-white">
                {profile?.username || "Not set"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">Location</span>
              <span className="text-sm text-white">
                {profile?.location || "Not set"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">Audience Country</span>
              <span className="text-sm text-white">
                {profile?.audienceCountry || "Not set"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-sm font-medium text-zinc-300 mb-4">
            Social Links
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">Instagram</span>
              <span className="text-sm text-violet-400">
                {profile?.instagramUsername
                  ? `@${profile.instagramUsername}`
                  : "Not linked"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">YouTube</span>
              <span className="text-sm text-violet-400 truncate max-w-[200px]">
                {profile?.youtubeUrl || "Not linked"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">LinkedIn</span>
              <span className="text-sm text-violet-400 truncate max-w-[200px]">
                {profile?.linkedInUrl || "Not linked"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">Portfolio</span>
              <span className="text-sm text-violet-400 truncate max-w-[200px]">
                {profile?.portfolioUrl || "Not linked"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* bio */}
      {profile?.bio && (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-sm font-medium text-zinc-300 mb-3">Bio</h2>
          <p className="text-sm text-zinc-400">{profile.bio}</p>
        </div>
      )}
    </div>
  );
};

export default CreatorDashboard;
