import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  MapPin,
  Building,
  Globe,
  ArrowLeft,
  AtSign,
  Link2,
  Mail,
  User,
  Send,
  Check,
  X,
} from "lucide-react";
import { toast } from "sonner";

const BrandDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchBrand = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://13.239.47.56:5001/api/brand/" + id,
          {
            headers: { Authorization: token },
          },
        );
        console.log("Brand detail:", res.data);
        setBrand(res.data.brand);

        if (res.data.brand?.userId) {
          const connRes = await axios.get(
            "http://13.239.47.56:5001/api/connections/check/" +
              res.data.brand.userId,
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
        console.log("Failed to load brand", error);
        setError("Brand not found");
      } finally {
        setLoading(false);
      }
    };
    fetchBrand();
  }, [id]);

  const handleConnect = async () => {
    setSending(true);
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        "http://13.239.47.56:5001/api/connections/send",
        {
          receiverId: brand.userId,
        },
        {
          headers: { Authorization: token },
        },
      );
      setConnectionStatus("pending");
      toast.success("Request sent!");
      console.log("Connection request sent to", brand.companyName);
    } catch (error) {
      console.log("Failed to send request", error);
      toast.error(error.response?.data?.message || "Failed to send request");
    } finally {
      setSending(false);
    }
  };

  if (loading) return <p className="text-zinc-400">Loading brand profile...</p>;

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
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Browse
      </button>

      {/* header */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="flex items-start gap-4">
          <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-xl font-semibold text-violet-300">
            {brand?.companyName?.slice(0, 2).toUpperCase() || "BR"}
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-white">
              {brand?.companyName || "Brand"}
            </h1>
            {brand?.industry && (
              <p className="text-sm text-violet-400">{brand.industry}</p>
            )}
            {brand?.location && (
              <div className="flex items-center gap-1 mt-1 text-sm text-zinc-500">
                <MapPin className="size-3.5" />
                {brand.location}
              </div>
            )}

            {brand?.preferredNiche && brand.preferredNiche.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {brand.preferredNiche.map((n) => (
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

        {brand?.description && (
          <p className="mt-4 text-sm text-zinc-400 border-t border-white/5 pt-4">
            {brand.description}
          </p>
        )}

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

      {/* company info cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
          <Building className="size-5 text-violet-400 mx-auto mb-2" />
          <p className="text-lg font-semibold text-white">
            {brand?.companySize || "—"}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Company Size</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
          <Globe className="size-5 text-violet-400 mx-auto mb-2" />
          <p className="text-lg font-semibold text-white">
            {brand?.targetCountry || "—"}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Target Country</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
          <p className="text-lg font-semibold text-white">
            {brand?.budgetRange || "—"}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Budget Range</p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center">
          <p className="text-lg font-semibold text-white">
            {brand?.campaignFrequency || "—"}
          </p>
          <p className="text-xs text-zinc-500 mt-1">Campaign Frequency</p>
        </div>
      </div>

      {/* marketing details */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-sm font-medium text-zinc-300 mb-4">
            Marketing Details
          </h2>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">Target Audience</span>
              <span className="text-sm text-white">
                {brand?.targetAudience || "Not specified"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">Marketing Goals</span>
              <span className="text-sm text-white">
                {brand?.marketingGoals || "Not specified"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-zinc-500">Preferred Platform</span>
              <span className="text-sm text-white">
                {brand?.preferredPlatform || "Not specified"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-6">
          <h2 className="text-sm font-medium text-zinc-300 mb-4">
            Contact & Social
          </h2>
          <div className="space-y-3">
            {brand?.contactPerson && (
              <div className="flex items-center gap-3">
                <User className="size-4 text-zinc-500" />
                <span className="text-sm text-white">
                  {brand.contactPerson}
                </span>
              </div>
            )}
            {brand?.contactEmail && (
              <div className="flex items-center gap-3">
                <Mail className="size-4 text-zinc-500" />
                <span className="text-sm text-violet-400">
                  {brand.contactEmail}
                </span>
              </div>
            )}
            {brand?.website && (
              <div className="flex items-center gap-3">
                <Globe className="size-4 text-zinc-500" />
                <a
                  href={brand.website}
                  target="_blank"
                  className="text-sm text-violet-400 hover:underline"
                >
                  {brand.website}
                </a>
              </div>
            )}
            {brand?.instagramPage && (
              <div className="flex items-center gap-3">
                <AtSign className="size-4 text-zinc-500" />
                <span className="text-sm text-violet-400">
                  {brand.instagramPage}
                </span>
              </div>
            )}
            {brand?.linkedInPage && (
              <div className="flex items-center gap-3">
                <Link2 className="size-4 text-zinc-500" />
                <a
                  href={brand.linkedInPage}
                  target="_blank"
                  className="text-sm text-violet-400 hover:underline"
                >
                  {brand.linkedInPage}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandDetail;
