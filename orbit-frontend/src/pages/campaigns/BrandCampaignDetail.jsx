import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Clock,
  Layers,
  Send,
  XCircle,
  Plus,
  Trash2,
  Check,
  Loader2,
  AlertCircle,
  Handshake,
  User,
  CheckCircle2,
  Undo2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const AVAILABLE_NICHES = [
  "Tech",
  "Education",
  "Fitness",
  "Fashion",
  "Beauty",
  "Gaming",
  "Travel",
  "Food",
  "Lifestyle",
];

export default function BrandCampaignDetail() {
  const { campaignId } = useParams();
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [closing, setClosing] = useState(false);

  // Application states
  const [applications, setApplications] = useState([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [appFilter, setAppFilter] = useState("all");
  const [processingAppId, setProcessingAppId] = useState(null);

  // Form states for editing draft
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [niche, setNiche] = useState([]);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [deliverables, setDeliverables] = useState([]);
  const [newDeliverableInput, setNewDeliverableInput] = useState("");
  const [applicationDeadline, setApplicationDeadline] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchApplications = async () => {
    try {
      setLoadingApps(true);
      const res = await api.get(`/campaigns/${campaignId}/applications`);
      setApplications(res.data.applications || []);
    } catch (err) {
      console.error("Failed to load applications", err);
    } finally {
      setLoadingApps(false);
    }
  };

  const handleAcceptApplication = async (appId) => {
    try {
      setProcessingAppId(appId);
      await api.patch(`/applications/${appId}/accept`);
      toast.success("Application accepted! Collaboration created.");
      setApplications((prev) =>
        prev.map((a) => (a._id === appId ? { ...a, status: "accepted" } : a))
      );
    } catch (err) {
      console.error("Failed to accept application", err);
      toast.error(err.response?.data?.message || "Failed to accept application.");
    } finally {
      setProcessingAppId(null);
    }
  };

  const handleRejectApplication = async (appId) => {
    if (!window.confirm("Are you sure you want to decline this application?")) return;
    try {
      setProcessingAppId(appId);
      await api.patch(`/applications/${appId}/reject`);
      toast.success("Application declined.");
      setApplications((prev) =>
        prev.map((a) => (a._id === appId ? { ...a, status: "rejected" } : a))
      );
    } catch (err) {
      console.error("Failed to decline application", err);
      toast.error(err.response?.data?.message || "Failed to decline application.");
    } finally {
      setProcessingAppId(null);
    }
  };

  const fetchCampaign = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get(`/campaigns/${campaignId}`);
      const camp = res.data.campaign;
      setCampaign(camp);

      // Populate form fields
      setTitle(camp.title || "");
      setDescription(camp.description || "");
      setNiche(camp.niche || []);
      setBudgetMin(camp.budgetMin?.toString() || "0");
      setBudgetMax(camp.budgetMax?.toString() || "0");
      setDeliverables(camp.deliverables || []);
      setApplicationDeadline(camp.applicationDeadline ? camp.applicationDeadline.slice(0, 10) : "");
      setStartDate(camp.startDate ? camp.startDate.slice(0, 10) : "");
      setEndDate(camp.endDate ? camp.endDate.slice(0, 10) : "");

      fetchApplications();
    } catch (err) {
      console.error("Failed to load campaign", err);
      setError(err.response?.data?.message || "Failed to load campaign details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const loadCampaign = async () => {
      try {
        const res = await api.get(`/campaigns/${campaignId}`);
        if (!isMounted) return;
        const camp = res.data.campaign;
        setCampaign(camp);

        setTitle(camp.title || "");
        setDescription(camp.description || "");
        setNiche(camp.niche || []);
        setBudgetMin(camp.budgetMin?.toString() || "0");
        setBudgetMax(camp.budgetMax?.toString() || "0");
        setDeliverables(camp.deliverables || []);
        setApplicationDeadline(camp.applicationDeadline ? camp.applicationDeadline.slice(0, 10) : "");
        setStartDate(camp.startDate ? camp.startDate.slice(0, 10) : "");
        setEndDate(camp.endDate ? camp.endDate.slice(0, 10) : "");

        fetchApplications();
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to load campaign", err);
        setError(err.response?.data?.message || "Failed to load campaign details.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadCampaign();
    return () => {
      isMounted = false;
    };
  }, [campaignId]);

  const toggleNiche = (n) => {
    setNiche((prev) =>
      prev.includes(n) ? prev.filter((item) => item !== n) : [...prev, n]
    );
  };

  const handleAddDeliverable = () => {
    if (!newDeliverableInput.trim()) return;
    setDeliverables((prev) => [...prev, newDeliverableInput.trim()]);
    setNewDeliverableInput("");
  };

  const handleRemoveDeliverable = (index) => {
    setDeliverables((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveChanges = async () => {
    if (!title.trim()) {
      toast.error("Campaign title cannot be empty");
      return;
    }
    if (!description.trim()) {
      toast.error("Campaign description cannot be empty");
      return;
    }

    const min = Number(budgetMin) || 0;
    const max = Number(budgetMax) || 0;
    if (min < 0 || max < 0) {
      toast.error("Budget cannot be negative");
      return;
    }
    if (max > 0 && min > max) {
      toast.error("Minimum budget cannot exceed maximum budget");
      return;
    }

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      toast.error("End date cannot be earlier than start date");
      return;
    }

    setSaving(true);
    try {
      await api.put(`/campaigns/${campaignId}`, {
        title: title.trim(),
        description: description.trim(),
        niche,
        budgetMin: min,
        budgetMax: max,
        deliverables,
        applicationDeadline: applicationDeadline || null,
        startDate: startDate || null,
        endDate: endDate || null,
      });
      toast.success("Campaign updated successfully");
      fetchCampaign();
    } catch (err) {
      console.error("Update failed", err);
      toast.error(err.response?.data?.message || "Failed to update campaign");
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    const max = Number(budgetMax) || 0;
    if (max <= 0) {
      toast.error("A maximum budget greater than $0 is required to publish");
      return;
    }
    if (deliverables.length === 0) {
      toast.error("At least one deliverable is required to publish");
      return;
    }
    if (!applicationDeadline) {
      toast.error("An application deadline is required to publish");
      return;
    }

    setPublishing(true);
    try {
      // First save any unsaved edits
      await api.put(`/campaigns/${campaignId}`, {
        title: title.trim(),
        description: description.trim(),
        niche,
        budgetMin: Number(budgetMin) || 0,
        budgetMax: max,
        deliverables,
        applicationDeadline: applicationDeadline || null,
        startDate: startDate || null,
        endDate: endDate || null,
      });

      // Then publish
      await api.patch(`/campaigns/${campaignId}/publish`);
      toast.success("Campaign published to marketplace!");
      fetchCampaign();
    } catch (err) {
      console.error("Publish failed", err);
      toast.error(err.response?.data?.message || "Failed to publish campaign");
    } finally {
      setPublishing(false);
    }
  };

  const handleClose = async () => {
    setClosing(true);
    try {
      await api.patch(`/campaigns/${campaignId}/close`);
      toast.success("Campaign closed");
      fetchCampaign();
    } catch (err) {
      console.error("Close failed", err);
      toast.error(err.response?.data?.message || "Failed to close campaign");
    } finally {
      setClosing(false);
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
        Loading campaign details...
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <p className="text-red-400 text-sm">{error || "Campaign not found"}</p>
        <Button
          onClick={() => navigate("/brand/campaigns")}
          className="bg-white/5 border-white/10 text-white hover:bg-white/10"
        >
          Back to Campaigns
        </Button>
      </div>
    );
  }

  const isDraft = campaign.status === "draft";
  const isPublished = campaign.status === "published";
  const isClosed = campaign.status === "closed";

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Back button */}
      <button
        onClick={() => navigate("/brand/campaigns")}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="size-4" />
        Back to Campaigns
      </button>

      {/* Header card with status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            {isPublished && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-300">
                <span className="size-1.5 rounded-full bg-green-400 animate-pulse" />
                Published
              </span>
            )}
            {isDraft && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-300">
                <span className="size-1.5 rounded-full bg-yellow-400" />
                Draft
              </span>
            )}
            {isClosed && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/60 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
                <span className="size-1.5 rounded-full bg-zinc-500" />
                Closed
              </span>
            )}
            <span className="text-xs text-zinc-500">
              Created {formatDate(campaign.createdAt)}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-semibold text-white">
            {campaign.title}
          </h1>
        </div>

        {/* Quick Lifecycle Actions */}
        <div className="flex items-center gap-2">
          {isDraft && (
            <Button
              onClick={handlePublish}
              disabled={publishing || saving}
              className="bg-green-600 hover:bg-green-500 text-white text-xs font-medium flex items-center gap-1.5"
            >
              {publishing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Send className="size-3.5" />
              )}
              Publish Campaign
            </Button>
          )}
          {isPublished && (
            <Button
              onClick={handleClose}
              disabled={closing}
              variant="outline"
              className="bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20 text-xs font-medium flex items-center gap-1.5"
            >
              {closing ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <XCircle className="size-3.5" />
              )}
              Close Campaign
            </Button>
          )}
        </div>
      </div>

      {/* Closed Banner */}
      {isClosed && (
        <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-4 text-xs text-zinc-400">
          <AlertCircle className="size-4 text-zinc-500 shrink-0" />
          <span>
            This campaign is closed. It is no longer visible on the creator marketplace and cannot be edited.
          </span>
        </div>
      )}

      {/* Draft Edit Mode vs Published/Closed View Mode */}
      {isDraft ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8 space-y-6">
          <h2 className="text-base font-semibold text-white border-b border-white/5 pb-3">
            Edit Campaign Brief
          </h2>

          {/* Title */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Campaign Title
            </label>
            <Input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="border-white/10 bg-white/5 text-white focus:border-violet-500"
              maxLength={200}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Description & Objectives
            </label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3.5 text-sm text-white focus:border-violet-500 focus:outline-none"
            />
          </div>

          {/* Niches */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Categories / Niches
            </label>
            <div className="flex flex-wrap gap-2 pt-1">
              {AVAILABLE_NICHES.map((n) => {
                const selected = niche.includes(n);
                return (
                  <button
                    type="button"
                    key={n}
                    onClick={() => toggleNiche(n)}
                    className={`rounded-full px-3.5 py-1 text-xs font-medium border transition-all ${
                      selected
                        ? "border-violet-500 bg-violet-600 text-white"
                        : "border-white/10 bg-white/5 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Budget */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Min Budget ($ USD)
              </label>
              <Input
                type="number"
                min="0"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                className="border-white/10 bg-white/5 text-white focus:border-violet-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Max Budget ($ USD)
              </label>
              <Input
                type="number"
                min="0"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                className="border-white/10 bg-white/5 text-white focus:border-violet-500"
              />
            </div>
          </div>

          {/* Deliverables */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Deliverables
            </label>
            {deliverables.map((item, index) => (
              <div
                key={index}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs text-white"
              >
                <span className="flex items-center gap-2">
                  <Check className="size-3.5 text-violet-400 shrink-0" />
                  {item}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveDeliverable(index)}
                  className="text-zinc-500 hover:text-red-400 p-1"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}

            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Add deliverable..."
                value={newDeliverableInput}
                onChange={(e) => setNewDeliverableInput(e.target.value)}
                className="border-white/10 bg-white/5 text-white text-xs focus:border-violet-500"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddDeliverable}
                className="bg-white/5 border-white/10 text-white hover:bg-white/10 shrink-0 text-xs"
              >
                <Plus className="size-3.5 mr-1" />
                Add
              </Button>
            </div>
          </div>

          {/* Dates */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Deadline
              </label>
              <Input
                type="date"
                value={applicationDeadline}
                onChange={(e) => setApplicationDeadline(e.target.value)}
                className="border-white/10 bg-white/5 text-white focus:border-violet-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border-white/10 bg-white/5 text-white focus:border-violet-500"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border-white/10 bg-white/5 text-white focus:border-violet-500"
              />
            </div>
          </div>

          {/* Save & Publish Buttons */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={saving || publishing}
              onClick={handleSaveChanges}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Save Changes
            </Button>
            <Button
              type="button"
              disabled={publishing || saving}
              onClick={handlePublish}
              className="bg-violet-600 text-white hover:bg-violet-500"
            >
              {publishing ? <Loader2 className="size-4 animate-spin mr-2" /> : <Send className="size-4 mr-2" />}
              Publish
            </Button>
          </div>
        </div>
      ) : (
        /* Published & Closed View Mode */
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
              <DollarSign className="size-4 text-violet-400 mx-auto mb-1" />
              <p className="text-xs text-zinc-500">Budget</p>
              <p className="text-sm font-semibold text-white mt-0.5">
                {formatBudget(campaign.budgetMin, campaign.budgetMax)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
              <Clock className="size-4 text-violet-400 mx-auto mb-1" />
              <p className="text-xs text-zinc-500">Deadline</p>
              <p className="text-sm font-semibold text-white mt-0.5">
                {formatDate(campaign.applicationDeadline)}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">
              <Calendar className="size-4 text-violet-400 mx-auto mb-1" />
              <p className="text-xs text-zinc-500">Campaign Timeline</p>
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

          {/* Details Content */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-6">
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                About the Campaign
              </h3>
              <p className="text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
                {campaign.description}
              </p>
            </div>

            {campaign.niche && campaign.niche.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Target Niches
                </h3>
                <div className="flex flex-wrap gap-2">
                  {campaign.niche.map((n) => (
                    <span
                      key={n}
                      className="rounded-full border border-violet-500/30 bg-violet-500/10 px-3 py-1 text-xs text-violet-300"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {campaign.deliverables && campaign.deliverables.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                  Required Deliverables
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
        </div>
      )}

      {/* Applications Section for Campaign */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <Handshake className="size-5 text-violet-400" />
              Creator Applications & Proposals
              <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-normal">
                {applications.length}
              </span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Review creator pitches, proposed compensation, and initiate collaborations
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { label: "All", value: "all" },
              { label: "Pending", value: "pending" },
              { label: "Accepted", value: "accepted" },
              { label: "Rejected", value: "rejected" },
            ].map((f) => {
              const count = f.value === "all" ? applications.length : applications.filter(a => a.status === f.value).length;
              return (
                <button
                  key={f.value}
                  onClick={() => setAppFilter(f.value)}
                  className={`px-3 py-1 rounded-xl text-xs font-medium transition-all ${
                    appFilter === f.value
                      ? "bg-violet-600 text-white"
                      : "bg-white/[0.04] text-zinc-400 hover:text-white border border-white/5"
                  }`}
                >
                  {f.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Applications List */}
        {loadingApps ? (
          <div className="py-12 text-center text-zinc-400 text-xs">
            <Loader2 className="size-5 animate-spin mx-auto mb-2 text-violet-400" />
            Loading applicant proposals...
          </div>
        ) : applications.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <p className="text-sm font-medium text-zinc-300">No applications received yet</p>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Once creators discover your published campaign, their pitches and proposed budgets will appear here for review.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {applications
              .filter((app) => appFilter === "all" || app.status === appFilter)
              .map((app) => {
                const creator = app.creator || {};
                const creatorProfile = app.creatorProfile || {};
                const isPending = app.status === "pending";
                const isAccepted = app.status === "accepted";
                const isRejected = app.status === "rejected";
                const isWithdrawn = app.status === "withdrawn";

                return (
                  <div
                    key={app._id}
                    className="rounded-xl border border-white/10 bg-white/[0.02] p-5 space-y-4 hover:border-white/20 transition-colors"
                  >
                    {/* Applicant Profile Header */}
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex size-11 items-center justify-center rounded-full bg-violet-500/15 text-sm font-semibold text-violet-300">
                          {creator.name?.slice(0, 2).toUpperCase() || "CR"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-semibold text-white">
                              {creator.name || "Creator"}
                            </h3>
                            {creatorProfile.handle && (
                              <span className="text-xs text-zinc-500">
                                @{creatorProfile.handle}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-zinc-400">
                            {creator.email}
                            {creatorProfile.niche && creatorProfile.niche.length > 0 && (
                              <span className="text-zinc-500 ml-2">
                                • {creatorProfile.niche.join(", ")}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div>
                        {isPending && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            <Clock className="size-3" />
                            Pending Review
                          </span>
                        )}
                        {isAccepted && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            <CheckCircle2 className="size-3" />
                            Accepted • Active
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
                            <XCircle className="size-3" />
                            Declined
                          </span>
                        )}
                        {isWithdrawn && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                            <Undo2 className="size-3" />
                            Withdrawn by Creator
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Proposal Details */}
                    <div className="rounded-lg bg-white/[0.02] border border-white/5 p-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-zinc-400">
                        <span className="font-medium text-zinc-300">Creator's Pitch:</span>
                        {app.proposedBudget !== null && app.proposedBudget !== undefined && (
                          <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                            <DollarSign className="size-3.5" />
                            Proposed Budget: ${app.proposedBudget.toLocaleString()}
                          </span>
                        )}
                      </div>
                      <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">
                        {app.pitch}
                      </p>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 text-xs text-zinc-500">
                      <span>Applied on: {formatDate(app.createdAt)}</span>

                      <div className="flex items-center gap-2">
                        {isPending && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={processingAppId === app._id}
                              onClick={() => handleRejectApplication(app._id)}
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs h-8 px-3"
                            >
                              Decline
                            </Button>
                            <Button
                              size="sm"
                              disabled={processingAppId === app._id}
                              onClick={() => handleAcceptApplication(app._id)}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-4 flex items-center gap-1.5"
                            >
                              {processingAppId === app._id ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                <Check className="size-3.5" />
                              )}
                              Accept Proposal
                            </Button>
                          </>
                        )}

                        {isAccepted && (
                          <Button
                            size="sm"
                            onClick={() => navigate("/brand/collaborations")}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-3.5 flex items-center gap-1.5"
                          >
                            <Handshake className="size-3.5" />
                            View Collaboration
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
}
