import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Undo2,
  DollarSign,
  ArrowRight,
  Loader2,
  Handshake,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CreatorApplications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError("");
      const params = {};
      if (selectedStatus !== "all") {
        params.status = selectedStatus;
      }
      const res = await api.get("/applications/mine", { params });
      setApplications(res.data.applications || []);
    } catch (err) {
      console.error("Failed to load applications", err);
      setError(err.response?.data?.message || "Failed to load your applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [selectedStatus]);

  const handleWithdraw = async (applicationId) => {
    if (!window.confirm("Are you sure you want to withdraw this application?")) {
      return;
    }

    try {
      setActionLoadingId(applicationId);
      const res = await api.patch(`/applications/${applicationId}/withdraw`);
      toast.success("Application withdrawn.");
      setApplications((prev) =>
        prev.map((app) => (app._id === applicationId ? res.data.application : app))
      );
    } catch (err) {
      console.error("Failed to withdraw application", err);
      toast.error(err.response?.data?.message || "Failed to withdraw application.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const statusPills = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Accepted", value: "accepted" },
    { label: "Rejected", value: "rejected" },
    { label: "Withdrawn", value: "withdrawn" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            My Applications
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Track and manage your proposals submitted to brand campaigns
          </p>
        </div>
        <Button
          onClick={() => navigate("/creator/campaigns")}
          className="bg-violet-600 hover:bg-violet-500 text-white text-xs px-4"
        >
          <Search className="size-3.5 mr-1.5" />
          Browse Campaigns
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {statusPills.map((pill) => (
          <button
            key={pill.value}
            onClick={() => setSelectedStatus(pill.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              selectedStatus === pill.value
                ? "bg-violet-600 text-white shadow-sm"
                : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-white border border-white/5"
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {/* Content State */}
      {loading ? (
        <div className="py-20 text-center text-zinc-400 text-sm">
          <Loader2 className="size-6 animate-spin mx-auto mb-2 text-violet-400" />
          Loading applications...
        </div>
      ) : error ? (
        <div className="py-12 text-center text-red-400 text-sm space-y-3">
          <p>{error}</p>
          <Button
            onClick={fetchApplications}
            variant="outline"
            className="border-white/10 text-white text-xs"
          >
            Retry
          </Button>
        </div>
      ) : applications.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center space-y-3">
          <FileText className="size-8 text-zinc-500 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No applications found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {selectedStatus === "all"
              ? "You haven't submitted any campaign applications yet. Browse published campaigns to submit your first proposal."
              : `You have no applications with status "${selectedStatus}".`}
          </p>
          {selectedStatus === "all" && (
            <Button
              onClick={() => navigate("/creator/campaigns")}
              className="bg-violet-600 hover:bg-violet-500 text-white text-xs mt-2"
            >
              Explore Campaigns
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const campaign = app.campaign || {};
            const brand = app.brand || {};
            const isPending = app.status === "pending";
            const isAccepted = app.status === "accepted";
            const isRejected = app.status === "rejected";
            const isWithdrawn = app.status === "withdrawn";

            return (
              <div
                key={app._id}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 space-y-4 hover:border-white/20 transition-colors"
              >
                {/* Header: Campaign Info + Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="space-y-1">
                    <Link
                      to={`/creator/campaigns/${app.campaignId}`}
                      className="text-base font-semibold text-white hover:text-violet-300 transition-colors flex items-center gap-1.5"
                    >
                      {campaign.title || "Campaign Brief"}
                      <ArrowRight className="size-3.5 opacity-60" />
                    </Link>
                    <p className="text-xs text-zinc-400">
                      Brand: <span className="text-zinc-200">{brand.companyName || campaign.brandName || "Brand"}</span>
                      {campaign.niche && campaign.niche.length > 0 && (
                        <span className="ml-2 text-zinc-500">• {campaign.niche.join(", ")}</span>
                      )}
                    </p>
                  </div>

                  <div>
                    {isPending && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                        <Clock className="size-3" />
                        Pending Review
                      </span>
                    )}
                    {isAccepted && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        <CheckCircle2 className="size-3" />
                        Accepted
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-300 border border-rose-500/20">
                        <XCircle className="size-3" />
                        Declined
                      </span>
                    )}
                    {isWithdrawn && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                        <Undo2 className="size-3" />
                        Withdrawn
                      </span>
                    )}
                  </div>
                </div>

                {/* Pitch Excerpt */}
                <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3.5 text-xs text-zinc-300 leading-relaxed">
                  <span className="text-zinc-500 font-medium block mb-1">Your Pitch:</span>
                  <p className="line-clamp-3 whitespace-pre-wrap">{app.pitch}</p>
                </div>

                {/* Meta details & action row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1 border-t border-white/5 text-xs text-zinc-400">
                  <div className="flex flex-wrap items-center gap-4">
                    <span>Applied on: <strong className="text-zinc-300 font-medium">{formatDate(app.createdAt)}</strong></span>
                    {app.proposedBudget !== null && app.proposedBudget !== undefined && (
                      <span className="flex items-center gap-1">
                        <DollarSign className="size-3.5 text-violet-400" />
                        Proposed: <strong className="text-zinc-200 font-medium">${app.proposedBudget.toLocaleString()}</strong>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {isPending && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoadingId === app._id}
                        onClick={() => handleWithdraw(app._id)}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs h-8 px-3"
                      >
                        {actionLoadingId === app._id ? (
                          <Loader2 className="size-3 animate-spin mr-1" />
                        ) : (
                          <Undo2 className="size-3 mr-1" />
                        )}
                        Withdraw
                      </Button>
                    )}

                    {isAccepted && (
                      <Button
                        size="sm"
                        onClick={() => navigate("/creator/collaborations")}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-3 flex items-center gap-1.5"
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
  );
}
