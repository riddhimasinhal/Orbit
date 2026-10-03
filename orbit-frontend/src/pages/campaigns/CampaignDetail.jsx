import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Clock,
  Layers,
  MapPin,
  Check,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CampaignDetail() {
  const { campaignId } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    const fetchCampaign = async () => {
      try {
        const res = await api.get(`/campaigns/${campaignId}`);
        if (!isMounted) return;
        setCampaign(res.data.campaign);
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to load campaign", err);
        setError(
          err.response?.data?.message || "Failed to load campaign details."
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchCampaign();
    return () => {
      isMounted = false;
    };
  }, [campaignId]);

  const formatBudget = (min, max) => {
    if (!min && !max) return "Negotiable";
    if (min && max) return `$${min.toLocaleString()} – $${max.toLocaleString()}`;
    if (max) return `Up to $${max.toLocaleString()}`;
    return `From $${min.toLocaleString()}`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="py-20 text-center text-zinc-400 text-sm">
        Loading campaign brief...
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <p className="text-red-400 text-sm">{error || "Campaign not found"}</p>
        <Button
          onClick={() => navigate("/creator/campaigns")}
          className="bg-white/5 border-white/10 text-white hover:bg-white/10"
        >
          Back to Campaigns
        </Button>
      </div>
    );
  }

  const brand = campaign.brand || {};

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Back button */}
      <button
        onClick={() => navigate("/creator/campaigns")}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Campaigns
      </button>

      {/* Main Campaign Header Card */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8 space-y-4">
        {/* Brand identity badge */}
        <div className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-violet-500/15 text-sm font-semibold text-violet-300">
            {brand.companyName?.slice(0, 2).toUpperCase() || "BR"}
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white">
              {brand.companyName || "Brand"}
            </h2>
            <div className="flex items-center gap-2 text-xs text-zinc-400 mt-0.5">
              {brand.industry && <span>{brand.industry}</span>}
              {brand.industry && brand.location && <span>•</span>}
              {brand.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3 text-zinc-500" />
                  {brand.location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Campaign Title */}
        <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight">
          {campaign.title}
        </h1>

        {/* Niche Pills */}
        {campaign.niche && campaign.niche.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {campaign.niche.map((n) => (
              <span
                key={n}
                className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-300 font-medium"
              >
                {n}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Metric Highlights Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
          <DollarSign className="size-4 text-violet-400 mx-auto mb-1" />
          <p className="text-xs text-zinc-500">Compensation</p>
          <p className="text-sm font-semibold text-white mt-0.5">
            {formatBudget(campaign.budgetMin, campaign.budgetMax)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
          <Clock className="size-4 text-violet-400 mx-auto mb-1" />
          <p className="text-xs text-zinc-500">Application Deadline</p>
          <p className="text-sm font-semibold text-white mt-0.5">
            {formatDate(campaign.applicationDeadline)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
          <Calendar className="size-4 text-violet-400 mx-auto mb-1" />
          <p className="text-xs text-zinc-500">Timeline</p>
          <p className="text-sm font-semibold text-white mt-0.5">
            {formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
          <Layers className="size-4 text-violet-400 mx-auto mb-1" />
          <p className="text-xs text-zinc-500">Deliverables</p>
          <p className="text-sm font-semibold text-white mt-0.5">
            {campaign.deliverables?.length || 0} items
          </p>
        </div>
      </div>

      {/* Brief Details */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 space-y-6">
        <div>
          <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2.5">
            Campaign Overview & Brief
          </h3>
          <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
            {campaign.description}
          </p>
        </div>

        {campaign.deliverables && campaign.deliverables.length > 0 && (
          <div>
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Expected Deliverables
            </h3>
            <div className="space-y-2">
              {campaign.deliverables.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-xs text-zinc-200"
                >
                  <Check className="size-3.5 text-violet-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Reserved Action Section for Phase 3B */}
      <div className="rounded-2xl border border-violet-500/20 bg-violet-950/20 p-6 sm:p-8 text-center space-y-3">
        <div className="mx-auto flex size-10 items-center justify-center rounded-xl bg-violet-500/20 text-violet-300">
          <Sparkles className="size-5" />
        </div>
        <h3 className="text-base font-semibold text-white">
          Creator Applications Opening Soon
        </h3>
        <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
          Application submissions, proposals, and direct pitch workflows will be available in Phase 3B. Stay tuned to apply and collaborate with {brand.companyName || "this brand"}.
        </p>
      </div>
    </div>
  );
}
