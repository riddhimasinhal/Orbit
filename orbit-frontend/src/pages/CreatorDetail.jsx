import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchCreator = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://13.239.47.56:5001/api/creator/" + id,
          {
            headers: { Authorization: token },
          },
        );
        console.log("Creator detail:", res.data);
        setCreator(res.data.creator);

        // check if already connected
        if (res.data.creator?.userId) {
          const connRes = await axios.get(
            "http://13.239.47.56:5001/api/connections/check/" +
              res.data.creator.userId,
            {
              headers: { Authorization: token },
            },
          );
          console.log("Connection check:", connRes.data);
          if (connRes.data.exists) {
            setConnectionStatus(connRes.data.status);
          }
        }
      } catch (error) {
        console.log("Failed to load creator", error);
        setError("Creator not found");
      } finally {
        setLoading(false);
      }
    };
    fetchCreator();
  }, [id]);

  const handleConnect = async () => {
    setSending(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://13.239.47.56:5001/api/connections/send",
        {
          receiverId: creator.userId,
        },
        {
          headers: { Authorization: token },
        },
      );
      setConnectionStatus("pending");
      toast.success("Request sent!");
      console.log("Connection request sent to", creator.fullName);
    } catch (error) {
      console.log("Failed to send request", error);
      toast.error(error.response?.data?.message || "Failed to send request");
    } finally {
      setSending(false);
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
            <h1 className="text-2xl font-semibold text-white">
              {creator?.fullName || "Creator"}
            </h1>
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
              <Send className="size-4" /> Request Pending
            </span>
          )}
          {connectionStatus === "accepted" && (
            <span className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-2 text-sm text-green-300">
              <Check className="size-4" /> Connected
            </span>
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
