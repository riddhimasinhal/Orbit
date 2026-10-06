import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import {
  MapPin,
  AtSign,
  Play,
  Link2,
  Globe,
  Eye,
  ArrowLeft,
  Users,
  Send,
  Check,
  X,
  Clock,
  MessageSquare,
  FolderOpen,
  ExternalLink,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

const formatNum = (num) => {
  if (!num) return "—";
  const n = Number(num);
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "K";
  return n.toString();
};

const CreatorDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [creator, setCreator] = useState(null);
  const [portfolioItems, setPortfolioItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [isSender, setIsSender] = useState(false);
  const [sending, setSending] = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchCreator = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get("/creator/" + id);
        if (!active) return;
        setCreator(res.data.creator);

        // Fetch creator portfolio items without N+1 overhead
        try {
          const portRes = await api.get("/creators/" + id + "/portfolio");
          if (active) {
            setPortfolioItems(portRes.data.portfolioItems || []);
          }
        } catch (portErr) {
          console.log("Failed to load creator portfolio", portErr);
        }

        // check if already connected
        if (res.data.creator?.userId) {
          const connRes = await api.get(
            "/connections/check/" + res.data.creator.userId,
          );
          if (!active) return;
          console.log("Connection check:", connRes.data);
          if (connRes.data.exists) {
            setConnectionStatus(connRes.data.status);
            setIsSender(Boolean(connRes.data.isSender));
          } else {
            setConnectionStatus(null);
            setIsSender(false);
          }
        }
      } catch (err) {
        if (!active) return;
        console.log("Failed to load creator", err);
        setError(err.response?.data?.message || "Creator not found");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    fetchCreator();
    return () => {
      active = false;
    };
  }, [id]);

  const handleConnect = async () => {
    if (sending || connectionStatus || !creator?.userId) return;
    setSending(true);
    try {
      await api.post("/connections/send", {
        receiverId: creator.userId,
      });
      setConnectionStatus("pending");
      setIsSender(true);
      toast.success("Request sent!");
      console.log("Connection request sent to", creator.fullName);
    } catch (error) {
      console.log("Failed to send request", error);
      toast.error(error.response?.data?.message || "Failed to send request");
    } finally {
      setSending(false);
    }
  };

  const handleStartChat = async () => {
    if (!creator?.userId || startingChat) return;
    setStartingChat(true);
    try {
      const res = await api.post("/conversations", {
        recipientId: creator.userId,
      });
      const convId = res.data.conversation?._id;
      if (convId) {
        navigate(`/brand/messages/${convId}`);
      } else {
        navigate("/brand/messages");
      }
    } catch (error) {
      console.log("Failed to start chat", error);
      toast.error(error.response?.data?.message || "Failed to start conversation");
    } finally {
      setStartingChat(false);
    }
  };

  if (loading)
    return <p className="text-zinc-400">Loading creator profile...</p>;

  if (error) {
    return (
      <div className="text-center py-16">
        <p className="text-zinc-400">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-3 text-sm text-violet-400 hover:text-violet-300"
        >
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Browse
      </button>

      {/* header card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xl font-semibold text-violet-300">
            {creator?.fullName?.slice(0, 2).toUpperCase() || "CR"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-2xl font-semibold text-white">
                {creator?.fullName || "Creator"}
              </h1>
              {creator?.verificationStatus === "verified" && (
                <span
                  className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-medium text-emerald-400"
                  title="Verified by Orbit"
                >
                  <CheckCircle2 className="size-3.5" />
                  Verified by Orbit
                </span>
              )}
            </div>
            {creator?.username && (
              <p className="text-sm text-violet-400">@{creator.username}</p>
            )}
            {creator?.location && (
              <div className="flex items-center gap-1 mt-1 text-sm text-zinc-500">
                <MapPin className="size-3.5" />
                {creator.location}
              </div>
            )}

            {creator?.niche && creator.niche.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {creator.niche.map((n) => (
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

        {creator?.bio && (
          <p className="mt-4 text-sm text-zinc-400 border-t border-white/5 pt-4">
            {creator.bio}
          </p>
        )}

        {/* connect button */}
        <div className="mt-4 pt-3">
          {connectionStatus === null && (
            <button
              onClick={handleConnect}
              disabled={sending}
              className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50"
            >
              <Send className="size-4" />
              {sending ? "Sending..." : "Send Collab Request"}
            </button>
          )}
          {connectionStatus === "pending" && (
            <span className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-4 py-2 text-sm text-yellow-300">
              <Clock className="size-4" />
              {isSender ? "Request Pending" : "Request Received (Check Requests)"}
            </span>
          )}
          {connectionStatus === "accepted" && (
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-300">
                <Check className="size-4" /> Connected
              </span>
              <button
                onClick={handleStartChat}
                disabled={startingChat}
                className="flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
              >
                <MessageSquare className="size-4" />
                {startingChat ? "Opening..." : "Message"}
              </button>
            </div>
          )}
          {connectionStatus === "declined" && (
            <span className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
              <X className="size-4" /> Request Declined
            </span>
          )}
        </div>
      </div>

      {/* audience stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
          <AtSign className="size-5 text-violet-400 mx-auto mb-2" />
          <p className="text-2xl font-semibold text-white">
            {formatNum(creator?.instagramFollowers)}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Instagram Followers</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
          <Users className="size-5 text-violet-400 mx-auto mb-2" />
          <p className="text-2xl font-semibold text-white">
            {formatNum(creator?.youtubeSubscribers)}
          </p>
          <p className="text-xs text-zinc-500 mt-1">YouTube Subscribers</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
          <Eye className="size-5 text-violet-400 mx-auto mb-2" />
          <p className="text-2xl font-semibold text-white">
            {formatNum(creator?.averageViews)}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Avg Views Per Post</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
          <Globe className="size-5 text-violet-400 mx-auto mb-2" />
          <p className="text-2xl font-semibold text-white">
            {creator?.audienceCountry || "—"}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Audience Country</p>
        </div>
      </div>

      {/* Creator Portfolio & Past Work Showcase */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <FolderOpen className="size-5 text-violet-400" />
              Portfolio & Creative Showcase
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-normal">
                {portfolioItems.length}
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Work samples, campaign case studies, and content produced by {creator?.fullName || "this creator"}
            </p>
          </div>
        </div>

        {portfolioItems.length === 0 ? (
          <div className="text-center py-8 space-y-2">
            <Sparkles className="size-6 text-zinc-500 mx-auto" />
            <p className="text-sm font-medium text-zinc-300">
              No portfolio items shared yet
            </p>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              This creator has not uploaded any portfolio showcase items yet.
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
          {creator?.instagramUsername && (
            <div className="flex items-center gap-3">
              <AtSign className="size-4 text-zinc-500" />
              <span className="text-sm text-violet-400">
                @{creator.instagramUsername}
              </span>
            </div>
          )}
          {creator?.youtubeUrl && (
            <div className="flex items-center gap-3">
              <Play className="size-4 text-zinc-500" />
              <a
                href={creator.youtubeUrl}
                target="_blank"
                className="text-sm text-violet-400 hover:underline"
              >
                {creator.youtubeUrl}
              </a>
            </div>
          )}
          {creator?.linkedInUrl && (
            <div className="flex items-center gap-3">
              <Link2 className="size-4 text-zinc-500" />
              <a
                href={creator.linkedInUrl}
                target="_blank"
                className="text-sm text-violet-400 hover:underline"
              >
                {creator.linkedInUrl}
              </a>
            </div>
          )}
          {creator?.portfolioUrl && (
            <div className="flex items-center gap-3">
              <Globe className="size-4 text-zinc-500" />
              <a
                href={creator.portfolioUrl}
                target="_blank"
                className="text-sm text-violet-400 hover:underline"
              >
                {creator.portfolioUrl}
              </a>
            </div>
          )}
          {!creator?.instagramUsername &&
            !creator?.youtubeUrl &&
            !creator?.linkedInUrl &&
            !creator?.portfolioUrl && (
              <p className="text-sm text-zinc-600">No social links added.</p>
            )}
        </div>
      </div>
    </div>
  );
};

export default CreatorDetail;
