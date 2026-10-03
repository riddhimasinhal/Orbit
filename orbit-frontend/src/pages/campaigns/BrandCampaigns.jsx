import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import {
  Megaphone,
  Plus,
  DollarSign,
  Clock,
  Layers,
  ChevronRight,
  Send,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function BrandCampaigns() {
  const navigate = useNavigate();
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchCampaigns = useCallback(async (targetPage = 1, status = statusFilter) => {
    setLoading(true);
    setError("");
    try {
      let endpoint = `/campaigns/mine?page=${targetPage}&limit=9`;
      if (status && status !== "all") {
        endpoint += `&status=${status}`;
      }
      const res = await api.get(endpoint);
      setCampaigns(res.data.campaigns || []);
      if (res.data.pagination) {
        setPage(res.data.pagination.page);
        setTotalPages(res.data.pagination.totalPages);
      }
    } catch (err) {
      console.error("Failed to fetch campaigns", err);
      setError(err.response?.data?.message || "Failed to load campaigns.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    let isMounted = true;
    const loadInitial = async () => {
      try {
        let endpoint = `/campaigns/mine?page=1&limit=9`;
        if (statusFilter && statusFilter !== "all") {
          endpoint += `&status=${statusFilter}`;
        }
        const res = await api.get(endpoint);
        if (!isMounted) return;
        setCampaigns(res.data.campaigns || []);
        if (res.data.pagination) {
          setPage(res.data.pagination.page);
          setTotalPages(res.data.pagination.totalPages);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Failed to fetch campaigns", err);
        setError(err.response?.data?.message || "Failed to load campaigns.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadInitial();
    return () => {
      isMounted = false;
    };
  }, [statusFilter]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
      fetchCampaigns(newPage, statusFilter);
    }
  };

  const handleQuickPublish = async (e, campaignId) => {
    e.stopPropagation();
    if (actionLoadingId) return;
    setActionLoadingId(campaignId);
    try {
      await api.patch(`/campaigns/${campaignId}/publish`);
      toast.success("Campaign published to marketplace!");
      fetchCampaigns(page, statusFilter);
    } catch (err) {
      console.error("Failed to publish campaign", err);
      toast.error(err.response?.data?.message || "Failed to publish campaign");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleQuickClose = async (e, campaignId) => {
    e.stopPropagation();
    if (actionLoadingId) return;
    setActionLoadingId(campaignId);
    try {
      await api.patch(`/campaigns/${campaignId}/close`);
      toast.success("Campaign closed");
      fetchCampaigns(page, statusFilter);
    } catch (err) {
      console.error("Failed to close campaign", err);
      toast.error(err.response?.data?.message || "Failed to close campaign");
    } finally {
      setActionLoadingId(null);
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

  const getStatusBadge = (status) => {
    switch (status) {
      case "published":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-green-500/30 bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-300">
            <span className="size-1.5 rounded-full bg-green-400 animate-pulse" />
            Published
          </span>
        );
      case "closed":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-800/60 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
            <span className="size-1.5 rounded-full bg-zinc-500" />
            Closed
          </span>
        );
      case "draft":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-2.5 py-0.5 text-xs font-medium text-yellow-300">
            <span className="size-1.5 rounded-full bg-yellow-400" />
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-white flex items-center gap-2.5">
            <Megaphone className="size-6 text-violet-400" />
            My Campaigns
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Create, manage, and track your influencer collaboration briefs.
          </p>
        </div>
        <Button
          onClick={() => navigate("/brand/campaigns/new")}
          className="bg-violet-600 text-white hover:bg-violet-500 font-medium flex items-center gap-2 self-start sm:self-auto"
        >
          <Plus className="size-4" />
          Create Campaign
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex rounded-xl border border-white/10 bg-white/5 p-1 w-fit">
        {[
          { label: "All", value: "all" },
          { label: "Drafts", value: "draft" },
          { label: "Published", value: "published" },
          { label: "Closed", value: "closed" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={`rounded-lg px-4 py-1.5 text-xs font-medium transition-all ${
              statusFilter === tab.value
                ? "bg-violet-600 text-white shadow-sm"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content State */}
      {loading ? (
        <div className="py-20 text-center text-zinc-400 text-sm">
          Loading campaigns...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
          <p className="text-red-400 text-sm">{error}</p>
          <Button
            onClick={() => fetchCampaigns(page, statusFilter)}
            className="mt-4 bg-white/5 border-white/10 text-white hover:bg-white/10"
            size="sm"
          >
            Retry
          </Button>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-white/5 text-violet-400 mb-3 border border-white/10">
            <Megaphone className="size-6" />
          </div>
          <h3 className="text-base font-semibold text-white">No campaigns found</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
            {statusFilter === "all"
              ? "You haven't created any campaigns yet. Start creating your first brief to discover creators."
              : `You have no campaigns in "${statusFilter}" status.`}
          </p>
          {statusFilter === "all" && (
            <Button
              onClick={() => navigate("/brand/campaigns/new")}
              className="mt-4 bg-violet-600 text-white hover:bg-violet-500 text-xs"
              size="sm"
            >
              <Plus className="size-3.5 mr-1" />
              Create First Campaign
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((camp) => (
            <div
              key={camp._id}
              onClick={() => navigate(`/brand/campaigns/${camp._id}`)}
              className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-5 hover:border-violet-500/40 hover:bg-white/[0.05] transition-all cursor-pointer"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  {getStatusBadge(camp.status)}
                  <span className="text-[11px] text-zinc-500">
                    Created {formatDate(camp.createdAt)}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-white group-hover:text-violet-300 transition-colors line-clamp-1">
                  {camp.title}
                </h3>

                <p className="text-xs text-zinc-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {camp.description}
                </p>

                {/* Niches */}
                {camp.niche && camp.niche.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {camp.niche.slice(0, 3).map((n) => (
                      <span
                        key={n}
                        className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-300"
                      >
                        {n}
                      </span>
                    ))}
                    {camp.niche.length > 3 && (
                      <span className="text-[10px] text-zinc-500 self-center">
                        +{camp.niche.length - 3} more
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Meta details */}
              <div className="mt-4 pt-4 border-t border-white/5 space-y-2 text-xs">
                <div className="flex items-center justify-between text-zinc-300">
                  <span className="flex items-center gap-1.5 text-zinc-400">
                    <DollarSign className="size-3.5 text-zinc-500" />
                    Budget
                  </span>
                  <span className="font-medium text-white">
                    {formatBudget(camp.budgetMin, camp.budgetMax)}
                  </span>
                </div>

                {camp.applicationDeadline && (
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <Clock className="size-3.5 text-zinc-500" />
                      Deadline
                    </span>
                    <span className="text-zinc-300">
                      {formatDate(camp.applicationDeadline)}
                    </span>
                  </div>
                )}

                {camp.deliverables && camp.deliverables.length > 0 && (
                  <div className="flex items-center justify-between text-zinc-300">
                    <span className="flex items-center gap-1.5 text-zinc-400">
                      <Layers className="size-3.5 text-zinc-500" />
                      Deliverables
                    </span>
                    <span className="text-zinc-300">
                      {camp.deliverables.length}{" "}
                      {camp.deliverables.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                )}

                {/* Card footer action buttons */}
                <div className="pt-2 flex items-center justify-between gap-2">
                  <span className="text-xs text-violet-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    View brief <ChevronRight className="size-3.5" />
                  </span>

                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {camp.status === "draft" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoadingId === camp._id}
                        onClick={(e) => handleQuickPublish(e, camp._id)}
                        className="h-7 px-2.5 text-[11px] bg-green-500/10 border-green-500/30 text-green-300 hover:bg-green-500/20"
                      >
                        <Send className="size-3 mr-1" />
                        Publish
                      </Button>
                    )}
                    {camp.status === "published" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actionLoadingId === camp._id}
                        onClick={(e) => handleQuickClose(e, camp._id)}
                        className="h-7 px-2.5 text-[11px] bg-red-500/10 border-red-500/30 text-red-300 hover:bg-red-500/20"
                      >
                        <XCircle className="size-3 mr-1" />
                        Close
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && campaigns.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 disabled:opacity-40"
          >
            Previous
          </Button>
          <span className="text-xs text-zinc-400 px-2">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="bg-white/5 border-white/10 text-white hover:bg-white/10 disabled:opacity-40"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
