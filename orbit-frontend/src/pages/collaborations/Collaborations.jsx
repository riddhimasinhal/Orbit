import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import {
  Handshake,
  DollarSign,
  MessageSquare,
  UserCheck,
  Building2,
  User,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  ShieldAlert,
  FileText,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function Collaborations() {
  const navigate = useNavigate();
  const [collaborations, setCollaborations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Determine current user role
  const role = localStorage.getItem("role") || "creator";

  const fetchCollaborations = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError("");
      const params = {};
      if (statusFilter !== "all") {
        params.status = statusFilter;
      }
      const res = await api.get("/collaborations/mine", { params });
      setCollaborations(res.data.collaborations || []);
    } catch (err) {
      console.error("Failed to load collaborations", err);
      setError(err.response?.data?.message || "Failed to load collaborations.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        setError("");
        const params = {};
        if (statusFilter !== "all") {
          params.status = statusFilter;
        }
        const res = await api.get("/collaborations/mine", { params });
        if (!ignore) {
          setCollaborations(res.data.collaborations || []);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.response?.data?.message || "Failed to load collaborations.");
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [statusFilter]);

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
    { label: "Active", value: "active" },
    { label: "Completed", value: "completed" },
    { label: "Cancelled", value: "cancelled" },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Handshake className="size-6 text-violet-400" />
            Collaborations
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Active and ongoing campaign partnerships formed through accepted proposals
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {statusPills.map((pill) => (
          <button
            key={pill.value}
            onClick={() => setStatusFilter(pill.value)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
              statusFilter === pill.value
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
          Loading collaborations...
        </div>
      ) : error ? (
        <div className="py-12 text-center text-red-400 text-sm space-y-3">
          <p>{error}</p>
          <Button
            onClick={fetchCollaborations}
            variant="outline"
            className="border-white/10 text-white text-xs"
          >
            Retry
          </Button>
        </div>
      ) : collaborations.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center space-y-3">
          <Handshake className="size-8 text-zinc-500 mx-auto" />
          <h3 className="text-sm font-semibold text-white">No collaborations found</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {statusFilter === "all"
              ? "Collaborations are created when a brand accepts a campaign application. You have no collaborations yet."
              : `No collaborations with status "${statusFilter}".`}
          </p>
          {role === "creator" && (
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
          {collaborations.map((collab) => {
            const campaign = collab.campaign || {};
            const creator = collab.creator || {};
            const brand = collab.brand || {};
            const application = collab.application || {};
            const partner = role === "creator" ? brand : creator;
            const isConnected = collab.isConnectedWithPartner;

            return (
              <div
                key={collab._id}
                className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 sm:p-6 space-y-4 hover:border-white/20 transition-colors"
              >
                {/* Header: Campaign title + Status Badge */}
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium uppercase tracking-wider text-violet-400">
                        Campaign Partnership
                      </span>
                      <span className="text-zinc-600">•</span>
                      <span className="text-xs text-zinc-400">
                        Started {formatDate(collab.createdAt)}
                      </span>
                    </div>
                    <h2 className="text-lg font-semibold text-white mt-1">
                      {campaign.title || "Campaign Collaboration"}
                    </h2>
                  </div>

                  <div>
                    {collab.status === "active" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                        <CheckCircle2 className="size-3.5" />
                        Active Partnership
                      </span>
                    )}
                    {collab.status === "completed" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                        <CheckCircle2 className="size-3.5" />
                        Completed
                      </span>
                    )}
                    {collab.status === "cancelled" && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                        <XCircle className="size-3.5" />
                        Cancelled
                      </span>
                    )}
                  </div>
                </div>

                {/* Partner and Budget Info Card */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* Partner Identity */}
                  <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-violet-500/15 text-sm font-semibold text-violet-300 shrink-0">
                      {role === "creator" ? (
                        <Building2 className="size-4" />
                      ) : (
                        <User className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-zinc-500">
                        {role === "creator" ? "Brand Partner" : "Creator Partner"}
                      </p>
                      <p className="text-sm font-medium text-white truncate">
                        {partner.name || (role === "creator" ? campaign.brandName : "Partner")}
                      </p>
                      <p className="text-xs text-zinc-400 truncate">{partner.email}</p>
                    </div>
                  </div>

                  {/* Agreed Compensation */}
                  <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 shrink-0">
                      <DollarSign className="size-5" />
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500">Agreed / Proposed Budget</p>
                      <p className="text-sm font-semibold text-white">
                        {application.proposedBudget !== null && application.proposedBudget !== undefined
                          ? `$${application.proposedBudget.toLocaleString()}`
                          : "Campaign Standard"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Deliverables Progress Preview */}
                {collab.progress && collab.progress.total > 0 && (
                  <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-300 flex items-center gap-1.5">
                        <FileText className="size-3.5 text-violet-400" />
                        Deliverables: {collab.progress.approved} of {collab.progress.total} approved
                      </span>
                      <div className="flex items-center gap-2">
                        {collab.progress.overdue > 0 && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                            <AlertTriangle className="size-3" />
                            {collab.progress.overdue} Overdue
                          </span>
                        )}
                        <span className="font-semibold text-violet-400 text-xs">
                          {collab.progress.percentage}%
                        </span>
                      </div>
                    </div>
                    <Progress value={collab.progress.percentage} className="h-1.5 bg-white/5" />
                  </div>
                )}

                {/* Accepted Pitch preview */}
                {application.pitch && (
                  <div className="rounded-xl bg-white/[0.02] border border-white/5 p-3.5 text-xs text-zinc-300 leading-relaxed">
                    <span className="text-zinc-500 font-medium block mb-1">
                      {role === "creator" ? "Your Accepted Pitch:" : "Creator's Proposal:"}
                    </span>
                    <p className="line-clamp-2 whitespace-pre-wrap">{application.pitch}</p>
                  </div>
                )}

                {/* Bottom Actions Row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-2 border-t border-white/5">
                  <div className="text-xs">
                    {isConnected ? (
                      <span className="text-emerald-400 flex items-center gap-1.5">
                        <UserCheck className="size-3.5" />
                        Connected on Orbit
                      </span>
                    ) : (
                      <span className="text-zinc-500 flex items-center gap-1.5">
                        <ShieldAlert className="size-3.5 text-amber-500" />
                        Direct chat requires an accepted connection request
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => navigate(`/${role}/collaborations/${collab._id}`)}
                      className="bg-violet-600 hover:bg-violet-500 text-white text-xs h-8 px-3.5 flex items-center gap-1.5 font-medium shadow-sm"
                    >
                      <Handshake className="size-3.5" />
                      Open Workspace
                    </Button>

                    {isConnected ? (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/${role}/messages`)}
                        className="border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 text-xs h-8 px-3 flex items-center gap-1.5"
                      >
                        <MessageSquare className="size-3.5" />
                        Chat
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          if (role === "creator") {
                            navigate(`/creator/brand/${collab.brandId}`);
                          } else {
                            navigate(`/brand/creator/${collab.creatorId}`);
                          }
                        }}
                        className="border-white/10 text-zinc-300 hover:text-white hover:bg-white/5 text-xs h-8 px-3 flex items-center gap-1.5"
                      >
                        <ExternalLink className="size-3.5" />
                        Profile
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
