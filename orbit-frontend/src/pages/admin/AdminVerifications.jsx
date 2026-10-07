import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  RotateCw,
  MapPin,
  FolderOpen,
  ExternalLink,
  AtSign,
  Play,
  Link2,
  Globe,
  Loader2,
  Info,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AdminVerifications() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [isForbidden, setIsForbidden] = useState(false);

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Action modals state
  const [approvingCreator, setApprovingCreator] = useState(null);
  const [isApproving, setIsApproving] = useState(false);

  const [rejectingCreator, setRejectingCreator] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionError, setRejectionError] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const fetchVerifications = useCallback(async (targetPage = 1, isManualRefresh = false) => {
    try {
      if (isManualRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");
      setIsForbidden(false);

      const res = await api.get(`/admin/verifications?page=${targetPage}&limit=10`);
      const items = res.data?.requests || res.data?.data || [];
      setRequests(items);
      setPage(res.data?.pagination?.page || targetPage);
      setTotalPages(res.data?.pagination?.totalPages || 1);
      setTotalCount(res.data?.pagination?.total ?? items.length);
    } catch (err) {
      console.error("Failed to fetch pending verifications", err);
      if (err.response?.status === 403) {
        setIsForbidden(true);
        setError("You don't have permission to access this page.");
      } else if (err.response?.status === 401) {
        setError("Session expired. Please log in again.");
      } else {
        setError(err.response?.data?.message || "Failed to load verification requests.");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    const initialLoad = async () => {
      try {
        setError("");
        setIsForbidden(false);
        const res = await api.get("/admin/verifications?page=1&limit=10");
        if (!ignore) {
          const items = res.data?.requests || res.data?.data || [];
          setRequests(items);
          setPage(res.data?.pagination?.page || 1);
          setTotalPages(res.data?.pagination?.totalPages || 1);
          setTotalCount(res.data?.pagination?.total ?? items.length);
        }
      } catch (err) {
        if (!ignore) {
          console.error("Failed to fetch pending verifications", err);
          if (err.response?.status === 403) {
            setIsForbidden(true);
            setError("You don't have permission to access this page.");
          } else if (err.response?.status === 401) {
            setError("Session expired. Please log in again.");
          } else {
            setError(err.response?.data?.message || "Failed to load verification requests.");
          }
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    initialLoad();
    return () => {
      ignore = true;
    };
  }, []);

  const handleRefresh = () => {
    fetchVerifications(page, true);
  };

  // Approve Flow
  const handleConfirmApprove = async () => {
    if (!approvingCreator || isApproving) return;
    setIsApproving(true);
    try {
      await api.patch(`/admin/verifications/${approvingCreator._id}/approve`);
      toast.success(`${approvingCreator.fullName || "Creator"} verified successfully!`);
      // Optimistically remove from list
      setRequests((prev) => prev.filter((r) => r._id !== approvingCreator._id));
      setTotalCount((prev) => Math.max(0, prev - 1));
      setApprovingCreator(null);
    } catch (err) {
      console.error("Failed to approve creator", err);
      toast.error(err.response?.data?.message || "Failed to approve verification request");
    } finally {
      setIsApproving(false);
    }
  };

  // Reject Flow
  const handleConfirmReject = async () => {
    if (!rejectingCreator || isRejecting) return;
    const trimmedReason = rejectionReason.trim();
    if (!trimmedReason) {
      setRejectionError("Please provide a rejection reason.");
      return;
    }

    setIsRejecting(true);
    setRejectionError("");
    try {
      await api.patch(`/admin/verifications/${rejectingCreator._id}/reject`, {
        reason: trimmedReason,
      });
      toast.success(`Verification request for ${rejectingCreator.fullName || "creator"} rejected.`);
      // Optimistically remove from list
      setRequests((prev) => prev.filter((r) => r._id !== rejectingCreator._id));
      setTotalCount((prev) => Math.max(0, prev - 1));
      setRejectingCreator(null);
      setRejectionReason("");
    } catch (err) {
      console.error("Failed to reject creator", err);
      setRejectionError(err.response?.data?.message || "Failed to reject verification request.");
      toast.error(err.response?.data?.message || "Failed to reject verification request");
    } finally {
      setIsRejecting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "Recently";
    }
  };

  if (isForbidden) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4">
        <div className="size-14 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
          <XCircle className="size-7" />
        </div>
        <h1 className="text-xl font-semibold text-white">Access Denied</h1>
        <p className="text-sm text-zinc-400 max-w-md">
          You don't have permission to access this page. Only authenticated Orbit administrators are authorized to review verification requests.
        </p>
        <Button
          onClick={() => navigate("/login")}
          className="bg-white/10 hover:bg-white/15 text-white text-xs"
        >
          Return to Login
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-300">
              <ShieldCheck className="size-4" />
            </div>
            <h1 className="text-2xl font-semibold text-white">Creator Verification</h1>
          </div>
          <p className="text-sm text-zinc-400 mt-1">
            Review creators requesting verification on Orbit.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-300">
            Pending Requests: <strong className="font-semibold text-white ml-0.5">{totalCount}</strong>
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            disabled={loading || refreshing}
            className="border-white/10 bg-white/[0.03] text-zinc-300 hover:text-white hover:bg-white/[0.08] text-xs h-8 gap-1.5"
          >
            <RotateCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Review Guidelines Checklist (Section 14) */}
      <div className="rounded-xl border border-violet-500/20 bg-violet-500/[0.04] p-4 text-xs space-y-2">
        <div className="flex items-center gap-2 text-violet-300 font-semibold">
          <Info className="size-4" />
          <span>Before approving, review:</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 text-zinc-300 pl-6">
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> Profile appears complete and legitimate
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> Creator bio and information appear genuine
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> Portfolio contains relevant sample work
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> Linked social/profile info is consistent
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> No obvious spam or suspicious activity
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-emerald-400">✓</span> Meets Orbit's internal verification standards
          </div>
        </div>
        <p className="text-[11px] text-zinc-500 pl-6 pt-1">
          These are review guidelines, not automated verification rules. Orbit verification represents an internal trust signal indicating this profile has been reviewed and approved by the Orbit team.
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-400 text-xs">
            <AlertTriangle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            size="sm"
            onClick={() => fetchVerifications(page)}
            className="bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs h-7"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <Loader2 className="size-8 text-violet-400 animate-spin mx-auto" />
          <p className="text-xs text-zinc-400">Loading verification requests...</p>
        </div>
      ) : requests.length === 0 ? (
        /* Empty state (Section 10) */
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-12 text-center space-y-3">
          <div className="size-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
            <CheckCircle2 className="size-6" />
          </div>
          <h2 className="text-base font-semibold text-white">No pending verification requests</h2>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            You're all caught up. When creators request profile verification, their submissions will appear here for review.
          </p>
        </div>
      ) : (
        /* Verification Request Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {requests.map((creator) => (
            <div
              key={creator._id}
              className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 flex flex-col justify-between space-y-4 hover:border-white/20 transition-all"
            >
              <div className="space-y-3">
                {/* Header: Avatar, Name, Niche */}
                <div className="flex items-start gap-3">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-violet-500/15 border border-violet-500/30 text-base font-semibold text-violet-300">
                    {creator.fullName?.slice(0, 2).toUpperCase() || "CR"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-white truncate">
                      {creator.fullName || "Creator"}
                    </h2>
                    {creator.username && (
                      <p className="text-xs text-violet-400 truncate">@{creator.username}</p>
                    )}
                    {creator.location && (
                      <div className="flex items-center gap-1 mt-0.5 text-[11px] text-zinc-500 truncate">
                        <MapPin className="size-3 shrink-0" />
                        <span>{creator.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Niche tags */}
                {Array.isArray(creator.niche) && creator.niche.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {creator.niche.map((n) => (
                      <span
                        key={n}
                        className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-300"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                )}

                {/* Bio snippet */}
                {creator.bio && (
                  <p className="text-xs text-zinc-400 line-clamp-2">{creator.bio}</p>
                )}

                {/* Meta: Request Date & Portfolio Count */}
                <div className="pt-2 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
                  <span>
                    Verification requested:{" "}
                    <strong className="text-zinc-300 font-medium">
                      {formatDate(creator.verificationRequestedAt)}
                    </strong>
                  </span>
                  <span className="flex items-center gap-1 text-zinc-300 font-medium">
                    <FolderOpen className="size-3.5 text-violet-400" />
                    Portfolio: {creator.portfolioCount ?? 0} items
                  </span>
                </div>

                {/* Social links */}
                <div className="flex items-center gap-2 pt-1">
                  {creator.instagramUsername && (
                    <a
                      href={`https://instagram.com/${creator.instagramUsername}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-zinc-500 hover:text-pink-400 transition-colors"
                      title={`@${creator.instagramUsername}`}
                    >
                      <AtSign className="size-3.5" />
                    </a>
                  )}
                  {creator.youtubeUrl && (
                    <a
                      href={creator.youtubeUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-zinc-500 hover:text-red-400 transition-colors"
                      title="YouTube"
                    >
                      <Play className="size-3.5" />
                    </a>
                  )}
                  {creator.linkedInUrl && (
                    <a
                      href={creator.linkedInUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-zinc-500 hover:text-blue-400 transition-colors"
                      title="LinkedIn"
                    >
                      <Link2 className="size-3.5" />
                    </a>
                  )}
                  {creator.portfolioUrl && (
                    <a
                      href={creator.portfolioUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-zinc-500 hover:text-violet-400 transition-colors"
                      title="Website / External Portfolio"
                    >
                      <Globe className="size-3.5" />
                    </a>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/admin/creator/${creator._id}`)}
                  className="border-white/10 bg-white/[0.02] text-zinc-300 hover:text-white hover:bg-white/[0.08] text-xs h-8 gap-1.5"
                >
                  <ExternalLink className="size-3" />
                  View Profile
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setRejectingCreator(creator);
                      setRejectionReason("");
                      setRejectionError("");
                    }}
                    className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300 text-xs h-8"
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setApprovingCreator(creator)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 gap-1"
                  >
                    <CheckCircle2 className="size-3.5" />
                    Approve
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination (Section 12) */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-white/10 text-xs text-zinc-400">
          <span>
            Page {page} of {totalPages} ({totalCount} total)
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1 || loading}
              onClick={() => fetchVerifications(page - 1)}
              className="border-white/10 bg-white/[0.03] text-zinc-300 hover:text-white text-xs h-7 gap-1"
            >
              <ChevronLeft className="size-3.5" />
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= totalPages || loading}
              onClick={() => fetchVerifications(page + 1)}
              className="border-white/10 bg-white/[0.03] text-zinc-300 hover:text-white text-xs h-7 gap-1"
            >
              Next
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Approve Confirmation Dialog (Section 7) */}
      <Dialog
        open={Boolean(approvingCreator)}
        onOpenChange={(open) => !isApproving && !open && setApprovingCreator(null)}
      >
        <DialogContent className="bg-[#0f0f15] border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <CheckCircle2 className="size-5 text-emerald-400" />
              Approve Creator?
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              You are about to mark{" "}
              <strong className="text-white">
                {approvingCreator?.fullName || "this creator"}
              </strong>{" "}
              as <span className="text-emerald-400 font-medium">"Verified by Orbit"</span>.
              The verified trust badge will become visible to all brands on Orbit.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isApproving}
              onClick={() => setApprovingCreator(null)}
              className="border-white/10 text-zinc-300 hover:text-white text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isApproving}
              onClick={handleConfirmApprove}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs gap-1.5"
            >
              {isApproving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Approving...
                </>
              ) : (
                "Approve Verification"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Verification Dialog (Section 8) */}
      <Dialog
        open={Boolean(rejectingCreator)}
        onOpenChange={(open) => !isRejecting && !open && setRejectingCreator(null)}
      >
        <DialogContent className="bg-[#0f0f15] border-white/10 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <XCircle className="size-5 text-red-400" />
              Reject Verification
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Provide a clear reason for rejecting{" "}
              <strong className="text-white">
                {rejectingCreator?.fullName || "this creator"}
              </strong>
              . This will be shown on the creator's profile so they can address issues and re-apply.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <label className="text-xs font-medium text-zinc-300">
              Rejection Reason <span className="text-red-400">*</span>
            </label>
            <Textarea
              value={rejectionReason}
              onChange={(e) => {
                setRejectionReason(e.target.value);
                if (rejectionError) setRejectionError("");
              }}
              placeholder="e.g., Portfolio requires at least 3 high-resolution sample pieces or verified project links."
              rows={4}
              maxLength={500}
              className="bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus-visible:ring-red-500 text-xs"
            />
            <div className="flex items-center justify-between text-[11px]">
              {rejectionError ? (
                <span className="text-red-400">{rejectionError}</span>
              ) : (
                <span className="text-zinc-500">Visible to creator</span>
              )}
              <span className="text-zinc-500">{rejectionReason.length}/500</span>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              disabled={isRejecting}
              onClick={() => setRejectingCreator(null)}
              className="border-white/10 text-zinc-300 hover:text-white text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={isRejecting || !rejectionReason.trim()}
              onClick={handleConfirmReject}
              className="bg-red-600 hover:bg-red-500 text-white text-xs gap-1.5"
            >
              {isRejecting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  Rejecting...
                </>
              ) : (
                "Reject Verification"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
