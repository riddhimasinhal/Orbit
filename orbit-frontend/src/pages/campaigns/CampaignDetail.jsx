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
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Undo2,
  Handshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function CampaignDetail() {
  const { campaignId } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Application state
  const [checkingApp, setCheckingApp] = useState(true);
  const [myApplication, setMyApplication] = useState(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [pitch, setPitch] = useState("");
  const [proposedBudget, setProposedBudget] = useState("");
  const [submittingApp, setSubmittingApp] = useState(false);
  const [withdrawingApp, setWithdrawingApp] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchCampaignAndApp = async () => {
    try {
      setLoading(true);
      setError("");

      const [campRes, appRes] = await Promise.all([
        api.get(`/campaigns/${campaignId}`),
        api.get(`/campaigns/${campaignId}/my-application`).catch((err) => {
          // If not a creator or unauthorized, return null safely
          return { data: { hasApplied: false, application: null } };
        }),
      ]);

      setCampaign(campRes.data.campaign);
      if (appRes?.data?.hasApplied) {
        setMyApplication(appRes.data.application);
      } else {
        setMyApplication(null);
      }
    } catch (err) {
      console.error("Failed to load campaign brief", err);
      setError(err.response?.data?.message || "Failed to load campaign details.");
    } finally {
      setLoading(false);
      setCheckingApp(false);
    }
  };

  useEffect(() => {
    fetchCampaignAndApp();
  }, [campaignId]);

  const handleApply = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!pitch.trim()) {
      setFormError("Please provide a pitch explaining how you plan to execute this campaign.");
      return;
    }

    if (pitch.trim().length < 10) {
      setFormError("Pitch must be at least 10 characters long.");
      return;
    }

    let parsedBudget = null;
    if (proposedBudget !== "") {
      parsedBudget = Number(proposedBudget);
      if (isNaN(parsedBudget) || parsedBudget < 0) {
        setFormError("Proposed budget must be a positive number.");
        return;
      }
    }

    try {
      setSubmittingApp(true);
      const res = await api.post(`/campaigns/${campaignId}/applications`, {
        pitch: pitch.trim(),
        proposedBudget: parsedBudget !== null ? parsedBudget : undefined,
      });

      toast.success("Application submitted successfully!");
      setMyApplication(res.data.application);
      setShowApplyForm(false);
      setPitch("");
      setProposedBudget("");
    } catch (err) {
      console.error("Failed to submit application", err);
      const msg = err.response?.data?.message || "Failed to submit application.";
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmittingApp(false);
    }
  };

  const handleWithdraw = async () => {
    if (!myApplication?._id) return;
    if (!window.confirm("Are you sure you want to withdraw your application? This action cannot be undone.")) {
      return;
    }

    try {
      setWithdrawingApp(true);
      const res = await api.patch(`/applications/${myApplication._id}/withdraw`);
      toast.success("Application withdrawn.");
      setMyApplication(res.data.application);
    } catch (err) {
      console.error("Failed to withdraw application", err);
      toast.error(err.response?.data?.message || "Failed to withdraw application.");
    } finally {
      setWithdrawingApp(false);
    }
  };

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
        <Loader2 className="size-6 animate-spin mx-auto mb-2 text-violet-400" />
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
  const isPublished = campaign.status === "published";

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

      {/* Application Status / Action Section */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
        {checkingApp ? (
          <div className="py-6 text-center text-sm text-zinc-400">
            <Loader2 className="size-5 animate-spin mx-auto mb-2 text-violet-400" />
            Checking application status...
          </div>
        ) : myApplication ? (
          /* User has already submitted an application */
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <h3 className="text-base font-semibold text-white">Your Application</h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Submitted on {formatDate(myApplication.createdAt)}
                </p>
              </div>

              {/* Status Badge */}
              <div>
                {myApplication.status === "pending" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    <Clock className="size-3.5" />
                    Pending Review
                  </span>
                )}
                {myApplication.status === "accepted" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    <CheckCircle2 className="size-3.5" />
                    Application Accepted
                  </span>
                )}
                {myApplication.status === "rejected" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
                    <XCircle className="size-3.5" />
                    Not Selected
                  </span>
                )}
                {myApplication.status === "withdrawn" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                    <Undo2 className="size-3.5" />
                    Withdrawn
                  </span>
                )}
              </div>
            </div>

            {/* Application details */}
            <div className="space-y-3 pt-2">
              {myApplication.proposedBudget !== null && myApplication.proposedBudget !== undefined && (
                <div>
                  <span className="text-xs text-zinc-400">Proposed Budget: </span>
                  <span className="text-xs font-semibold text-white">
                    ${myApplication.proposedBudget.toLocaleString()}
                  </span>
                </div>
              )}
              <div>
                <span className="text-xs text-zinc-400 block mb-1">Your Pitch:</span>
                <p className="text-sm text-zinc-300 bg-white/[0.02] p-4 rounded-xl border border-white/5 whitespace-pre-wrap leading-relaxed">
                  {myApplication.pitch}
                </p>
              </div>
            </div>

            {/* Actions based on application status */}
            <div className="pt-3 flex flex-wrap items-center gap-3">
              {myApplication.status === "pending" && (
                <Button
                  onClick={handleWithdraw}
                  disabled={withdrawingApp}
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs"
                >
                  {withdrawingApp ? (
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                  ) : (
                    <Undo2 className="size-3.5 mr-1.5" />
                  )}
                  Withdraw Application
                </Button>
              )}

              {myApplication.status === "accepted" && (
                <Button
                  onClick={() => navigate("/creator/collaborations")}
                  className="bg-emerald-600 text-white hover:bg-emerald-500 text-xs flex items-center gap-2"
                >
                  <Handshake className="size-3.5" />
                  View Active Collaboration
                </Button>
              )}
            </div>
          </div>
        ) : !isPublished ? (
          /* Campaign is not open for applications */
          <div className="text-center py-6 space-y-2">
            <AlertCircle className="size-6 text-zinc-500 mx-auto" />
            <h3 className="text-sm font-semibold text-zinc-300">
              Applications Closed
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              This campaign is currently closed or in draft mode and is not accepting new creator applications.
            </p>
          </div>
        ) : !showApplyForm ? (
          /* Ready to apply button */
          <div className="text-center py-4 space-y-3">
            <h3 className="text-base font-semibold text-white">
              Interested in this campaign?
            </h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto">
              Submit your pitch and proposed compensation directly to {brand.companyName || "the brand"} to start collaborating.
            </p>
            <Button
              onClick={() => setShowApplyForm(true)}
              className="bg-violet-600 hover:bg-violet-500 text-white font-medium px-6 py-2 rounded-xl text-sm"
            >
              <Send className="size-4 mr-2" />
              Apply to Campaign
            </Button>
          </div>
        ) : (
          /* Application Form */
          <form onSubmit={handleApply} className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-semibold text-white">
                Submit Your Proposal
              </h3>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowApplyForm(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </Button>
            </div>

            {formError && (
              <div className="rounded-xl border border-red-500/20 bg-red-950/20 px-4 py-3 text-xs text-red-300 flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Your Pitch & Creative Angle <span className="text-red-400">*</span>
              </label>
              <Textarea
                value={pitch}
                onChange={(e) => setPitch(e.target.value)}
                placeholder="Explain why you're a great fit for this campaign, your content style, audience demographics, and expected delivery format..."
                rows={5}
                className="bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 text-sm"
              />
              <p className="text-[11px] text-zinc-500 text-right">
                {pitch.length} / 3000 characters
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Proposed Compensation (USD)
              </label>
              <Input
                type="number"
                min="0"
                step="1"
                value={proposedBudget}
                onChange={(e) => setProposedBudget(e.target.value)}
                placeholder="e.g. 1500 (leave blank to accept campaign budget)"
                className="bg-white/[0.03] border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-violet-500 text-sm"
              />
              <p className="text-[11px] text-zinc-500">
                Brand budget: {formatBudget(campaign.budgetMin, campaign.budgetMax)}
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowApplyForm(false)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submittingApp}
                className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-5 font-medium"
              >
                {submittingApp ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="size-3.5 mr-1.5" />
                    Submit Application
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
