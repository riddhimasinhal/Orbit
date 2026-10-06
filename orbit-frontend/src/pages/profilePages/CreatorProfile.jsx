import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import {
  MapPin,
  AtSign,
  Play,
  Link2,
  Globe,
  FolderOpen,
  ExternalLink,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  ShieldCheck,
  Clock,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const formatNum = (num) => {
  if (!num) return "—";
  const n = Number(num);
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
};

const CreatorProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [requestingVerification, setRequestingVerification] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [profileRes, portfolioRes] = await Promise.all([
          api.get("/creator/profile"),
          api.get("/portfolio/mine").catch(() => ({ data: { portfolioItems: [] } })),
        ]);
        setProfile(profileRes.data.creator);
        setPortfolioItems(portfolioRes.data.portfolioItems || []);
      } catch (error) {
        console.log("Error loading profile", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleRequestVerification = async () => {
    if (requestingVerification) return;
    setRequestingVerification(true);
    try {
      const res = await api.post("/verification/request");
      toast.success(res.data.message || "Verification request submitted!");
      setProfile((prev) => ({
        ...prev,
        verificationStatus: "pending",
        verificationRequestedAt: res.data.requestedAt || new Date().toISOString(),
      }));
    } catch (err) {
      console.error("Failed to request verification", err);
      toast.error(err.response?.data?.message || "Failed to submit verification request");
    } finally {
      setRequestingVerification(false);
    }
  };

  if (loading) return <p className="text-zinc-400">Loading profile...</p>;

  return (
    <div className="space-y-6">
      {/* header card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xl font-semibold text-violet-300">
            {profile?.fullName?.slice(0, 2).toUpperCase() || "CR"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-semibold text-white">
                {profile?.fullName || "Creator"}
              </h1>
              {profile?.verificationStatus === "verified" && (
                <span
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400"
                  title="Verified by Orbit"
                >
                  <CheckCircle2 className="size-3.5" />
                  Verified by Orbit
                </span>
              )}
            </div>
            {profile?.username && (
              <p className="text-sm text-violet-400">@{profile.username}</p>
            )}
            {profile?.location && (
              <div className="flex items-center gap-1 mt-1 text-sm text-zinc-500">
                <MapPin className="size-3.5" />
                {profile.location}
              </div>
            )}
            {profile?.niche?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {profile.niche.map((n) => (
                  <span
                    key={n}
                    className="inline-block rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-300"
                  >
                    {n}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
        {profile?.bio && (
          <p className="mt-4 text-sm text-zinc-400 border-t border-white/5 pt-4">
            {profile.bio}
          </p>
        )}
      </div>

      {/* Verification Status Card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <ShieldCheck className="size-5 text-violet-400" />
            <h2 className="text-sm font-semibold text-white">Creator Verification</h2>
            {profile?.verificationStatus === "verified" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400">
                <CheckCircle2 className="size-3.5" />
                Verified by Orbit
              </span>
            )}
            {profile?.verificationStatus === "pending" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-400">
                <Clock className="size-3.5" />
                Verification Pending
              </span>
            )}
            {profile?.verificationStatus === "rejected" && (
              <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-400">
                <AlertCircle className="size-3.5" />
                Verification Rejected
              </span>
            )}
            {(!profile?.verificationStatus || profile?.verificationStatus === "unverified") && (
              <span className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
                Not Verified
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400">
            {profile?.verificationStatus === "verified"
              ? "Your profile is verified by Orbit. Brands can see the verified trust badge on your cards."
              : profile?.verificationStatus === "pending"
              ? "Your verification request is currently under review by the Orbit team."
              : profile?.verificationStatus === "rejected"
              ? `Reason: ${profile?.verificationRejectionReason || "Requirements not met."}`
              : "Get verified by Orbit to build credibility and trust with brands."}
          </p>
        </div>

        {(!profile?.verificationStatus || profile?.verificationStatus === "unverified" || profile?.verificationStatus === "rejected") && (
          <Button
            size="sm"
            onClick={handleRequestVerification}
            disabled={requestingVerification}
            className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-4 h-8 shrink-0 flex items-center gap-1.5"
          >
            {requestingVerification ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Requesting...
              </>
            ) : profile?.verificationStatus === "rejected" ? (
              "Request Again"
            ) : (
              "Request Verification"
            )}
          </Button>
        )}
      </div>

      {/* stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
          <p className="text-2xl font-semibold text-white">
            {formatNum(profile?.instagramFollowers)}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Instagram Followers</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
          <p className="text-2xl font-semibold text-white">
            {formatNum(profile?.youtubeSubscribers)}
          </p>
          <p className="text-xs text-zinc-500 mt-1">YouTube Subscribers</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
          <p className="text-2xl font-semibold text-white">
            {formatNum(profile?.averageViews)}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Avg Views Per Post</p>
        </div>
      </div>

      {/* Featured Portfolio Section */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <FolderOpen className="size-5 text-violet-400" />
              Creator Portfolio & Showcase
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Work samples and past campaign assets visible to brands
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => navigate("/creator/portfolio")}
            className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-3.5 h-8 flex items-center gap-1.5"
          >
            Manage Portfolio
            <ArrowRight className="size-3.5" />
          </Button>
        </div>

        {portfolioItems.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <Sparkles className="size-6 text-zinc-500 mx-auto" />
            <p className="text-sm font-medium text-zinc-300">
              No portfolio items added yet
            </p>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Add case studies, video links, or design samples to demonstrate your creative expertise.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-1">
            {portfolioItems.map((item) => (
              <div
                key={item._id}
                className="rounded-xl border border-white/10 bg-white/[0.02] overflow-hidden flex flex-col hover:border-white/20 transition-all group"
              >
                <div className="relative aspect-video w-full bg-zinc-900 border-b border-white/10 overflow-hidden flex items-center justify-center">
                  {item.mediaUrl && item.mediaType === "image" ? (
                    <img
                      src={item.mediaUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : item.mediaUrl && item.mediaType === "video" ? (
                    <video
                      src={item.mediaUrl}
                      poster={item.thumbnailUrl || undefined}
                      controls
                      preload="metadata"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Link2 className="size-8 text-violet-400/80" />
                  )}

                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/60 backdrop-blur-md text-white border border-white/10">
                      {item.mediaType === "image" ? "Image" : item.mediaType === "video" ? "Video" : "Link"}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h3 className="text-xs font-semibold text-white line-clamp-1 group-hover:text-violet-300 transition-colors">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-[11px] text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {item.projectUrl && (
                    <div className="pt-2 border-t border-white/5 flex items-center justify-end">
                      <a
                        href={item.projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors"
                      >
                        <span>View Project</span>
                        <ExternalLink className="size-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* social links */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
        <h2 className="text-sm font-medium text-zinc-300 mb-4">Social Links</h2>
        <div className="space-y-3">
          {profile?.instagramUsername && (
            <div className="flex items-center gap-3">
              <AtSign className="size-4 text-zinc-500" />
              <span className="text-sm text-violet-400">
                @{profile.instagramUsername}
              </span>
            </div>
          )}
          {profile?.youtubeUrl && (
            <div className="flex items-center gap-3">
              <Play className="size-4 text-zinc-500" />
              <span className="text-sm text-violet-400">
                {profile.youtubeUrl}
              </span>
            </div>
          )}
          {profile?.linkedInUrl && (
            <div className="flex items-center gap-3">
              <Link2 className="size-4 text-zinc-500" />
              <span className="text-sm text-violet-400">
                {profile.linkedInUrl}
              </span>
            </div>
          )}
          {profile?.portfolioUrl && (
            <div className="flex items-center gap-3">
              <Globe className="size-4 text-zinc-500" />
              <span className="text-sm text-violet-400">
                {profile.portfolioUrl}
              </span>
            </div>
          )}
          {!profile?.instagramUsername &&
            !profile?.youtubeUrl &&
            !profile?.linkedInUrl &&
            !profile?.portfolioUrl && (
              <p className="text-sm text-zinc-600">
                No social links added yet.
              </p>
            )}
        </div>
      </div>
    </div>
  );
};

export default CreatorProfile;
