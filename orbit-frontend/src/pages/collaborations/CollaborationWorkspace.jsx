import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import {
  ArrowLeft,
  Handshake,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCw,
  ExternalLink,
  Plus,
  Pencil,
  Trash2,
  MessageSquare,
  Building2,
  User,
  DollarSign,
  Calendar,
  Send,
  Loader2,
  AlertCircle,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function CollaborationWorkspace() {
  const { collaborationId } = useParams();
  const navigate = useNavigate();

  const [collaboration, setCollaboration] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);

  const [selectedDeliverable, setSelectedDeliverable] = useState(null);

  // Form states
  const [deliverableForm, setDeliverableForm] = useState({
    title: "",
    description: "",
    dueDate: "",
  });

  const [submitForm, setSubmitForm] = useState({
    submissionUrl: "",
    submissionNotes: "",
  });

  const [revisionFeedback, setRevisionFeedback] = useState("");

  const role = localStorage.getItem("role") || "creator";

  const fetchWorkspace = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError("");
      const res = await api.get(`/collaborations/${collaborationId}`);
      setCollaboration(res.data.collaboration);
    } catch (err) {
      console.error("Failed to load collaboration workspace:", err);
      if (err.response?.status === 403) {
        setError("You are not authorized to access this collaboration workspace.");
      } else if (err.response?.status === 404) {
        setError("Collaboration not found.");
      } else {
        setError(err.response?.data?.message || "Failed to load collaboration workspace.");
      }
    } finally {
      setLoading(false);
    }
  }, [collaborationId]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const res = await api.get(`/collaborations/${collaborationId}`);
        if (!ignore) {
          setCollaboration(res.data.collaboration);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          if (err.response?.status === 403) {
            setError("You are not authorized to access this collaboration workspace.");
          } else if (err.response?.status === 404) {
            setError("Collaboration not found.");
          } else {
            setError(err.response?.data?.message || "Failed to load collaboration workspace.");
          }
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [collaborationId]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleString([], {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // --- BRAND ACTIONS ---

  const handleAddDeliverable = async (e) => {
    e.preventDefault();
    if (!deliverableForm.title.trim()) {
      toast.error("Deliverable title is required");
      return;
    }

    try {
      setActionLoading(true);
      await api.post(`/collaborations/${collaborationId}/deliverables`, {
        title: deliverableForm.title.trim(),
        description: deliverableForm.description.trim(),
        dueDate: deliverableForm.dueDate || null,
      });
      toast.success("Deliverable added successfully");
      setAddModalOpen(false);
      setDeliverableForm({ title: "", description: "", dueDate: "" });
      await fetchWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add deliverable");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateDeliverable = async (e) => {
    e.preventDefault();
    if (!deliverableForm.title.trim()) {
      toast.error("Deliverable title is required");
      return;
    }

    try {
      setActionLoading(true);
      await api.put(`/collaborations/${collaborationId}/deliverables/${selectedDeliverable._id}`, {
        title: deliverableForm.title.trim(),
        description: deliverableForm.description.trim(),
        dueDate: deliverableForm.dueDate || null,
      });
      toast.success("Deliverable updated successfully");
      setEditModalOpen(false);
      setSelectedDeliverable(null);
      await fetchWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update deliverable");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDeliverable = async (deliv) => {
    if (!window.confirm(`Are you sure you want to delete "${deliv.title}"?`)) return;

    try {
      setActionLoading(true);
      await api.delete(`/collaborations/${collaborationId}/deliverables/${deliv._id}`);
      toast.success("Deliverable deleted successfully");
      await fetchWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete deliverable");
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveSubmission = async () => {
    if (!selectedDeliverable) return;

    try {
      setActionLoading(true);
      await api.post(`/collaborations/${collaborationId}/deliverables/${selectedDeliverable._id}/approve`);
      toast.success(`"${selectedDeliverable.title}" approved!`);
      setApproveModalOpen(false);
      setSelectedDeliverable(null);
      await fetchWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to approve deliverable");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRequestRevision = async (e) => {
    e.preventDefault();
    if (!revisionFeedback.trim()) {
      toast.error("Revision feedback is required");
      return;
    }

    try {
      setActionLoading(true);
      await api.post(`/collaborations/${collaborationId}/deliverables/${selectedDeliverable._id}/request-revision`, {
        feedback: revisionFeedback.trim(),
      });
      toast.success("Revision requested");
      setRevisionModalOpen(false);
      setRevisionFeedback("");
      setSelectedDeliverable(null);
      await fetchWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to request revision");
    } finally {
      setActionLoading(false);
    }
  };

  // --- CREATOR ACTIONS ---

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!submitForm.submissionUrl.trim()) {
      toast.error("Submission URL is required");
      return;
    }

    try {
      setActionLoading(true);
      await api.post(`/collaborations/${collaborationId}/deliverables/${selectedDeliverable._id}/submit`, {
        submissionUrl: submitForm.submissionUrl.trim(),
        submissionNotes: submitForm.submissionNotes.trim(),
      });
      toast.success("Deliverable submitted for review!");
      setSubmitModalOpen(false);
      setSubmitForm({ submissionUrl: "", submissionNotes: "" });
      setSelectedDeliverable(null);
      await fetchWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit deliverable");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-24 text-center text-zinc-400 space-y-3">
        <Loader2 className="size-8 animate-spin mx-auto text-violet-400" />
        <p className="text-sm">Loading collaboration workspace...</p>
      </div>
    );
  }

  if (error || !collaboration) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-4">
        <div className="size-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center mx-auto">
          <AlertCircle className="size-6" />
        </div>
        <h2 className="text-lg font-semibold text-white">Workspace Error</h2>
        <p className="text-sm text-zinc-400">{error || "Unable to access workspace."}</p>
        <div className="pt-2 flex justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/${role}/collaborations`)}
            className="border-white/10 text-zinc-300"
          >
            Back to Collaborations
          </Button>
          <Button
            size="sm"
            onClick={fetchWorkspace}
            className="bg-violet-600 hover:bg-violet-500 text-white"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const campaign = collaboration.campaign || {};
  const creator = collaboration.creator || {};
  const brand = collaboration.brand || {};
  const partner = role === "creator" ? brand : creator;
  const isConnected = collaboration.isConnectedWithPartner;
  const progress = collaboration.progress || {
    total: 0,
    approved: 0,
    submitted: 0,
    revisionRequested: 0,
    pending: 0,
    overdue: 0,
    percentage: 0,
  };
  const deliverables = collaboration.deliverables || [];
  const isBrand = role === "brand" || collaboration.brandId === localStorage.getItem("userId");
  const isCreator = role === "creator" || collaboration.creatorId === localStorage.getItem("userId");

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Top Navigation */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <button
          onClick={() => navigate(`/${role}/collaborations`)}
          className="inline-flex items-center gap-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="size-4" />
          Back to Collaborations
        </button>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchWorkspace}
            disabled={loading || actionLoading}
            className="text-zinc-400 hover:text-white text-xs h-8"
          >
            <RotateCw className="size-3.5 mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Collaboration Overview Header */}
      <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-violet-400 flex items-center gap-1.5">
                <Handshake className="size-3.5" />
                Collaboration Workspace
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs text-zinc-400">
                Created {formatDate(collaboration.createdAt)}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              {campaign.title || "Campaign Collaboration"}
            </h1>
            <p className="text-xs text-zinc-400">
              Manage deliverables, review submissions, and track campaign completion
            </p>
          </div>

          <div>
            {collaboration.status === "active" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                <CheckCircle2 className="size-3.5" />
                Active Campaign
              </span>
            )}
            {collaboration.status === "completed" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                <CheckCircle2 className="size-3.5" />
                Completed
              </span>
            )}
            {collaboration.status === "cancelled" && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                Cancelled
              </span>
            )}
          </div>
        </div>

        {/* Partner & Key Details Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          {/* Partner info */}
          <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex size-10 items-center justify-center rounded-full bg-violet-500/15 text-sm font-semibold text-violet-300 shrink-0">
                {role === "creator" ? <Building2 className="size-4" /> : <User className="size-4" />}
              </div>
              <div className="min-w-0">
                <p className="text-[11px] text-zinc-500">
                  {role === "creator" ? "Brand Partner" : "Creator Partner"}
                </p>
                <p className="text-sm font-medium text-white truncate">
                  {partner.name || (role === "creator" ? campaign.brandName : "Partner")}
                </p>
                <p className="text-xs text-zinc-400 truncate">{partner.email}</p>
              </div>
            </div>

            {isConnected ? (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate(`/${role}/messages`)}
                className="size-8 p-0 text-violet-400 hover:text-violet-300 hover:bg-violet-500/10"
                title="Message Partner"
              >
                <MessageSquare className="size-4" />
              </Button>
            ) : null}
          </div>

          {/* Agreed Compensation */}
          <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300 shrink-0">
              <DollarSign className="size-4" />
            </div>
            <div>
              <p className="text-[11px] text-zinc-500">Agreed Budget</p>
              <p className="text-sm font-semibold text-white">
                {collaboration.application?.proposedBudget !== null &&
                collaboration.application?.proposedBudget !== undefined
                  ? `$${collaboration.application.proposedBudget.toLocaleString()}`
                  : "Campaign Standard"}
              </p>
            </div>
          </div>

          {/* Deadline / Timeframe */}
          <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/15 text-blue-300 shrink-0">
              <Calendar className="size-4" />
            </div>
            <div>
              <p className="text-[11px] text-zinc-500">Campaign Timeline</p>
              <p className="text-xs font-medium text-white">
                {campaign.startDate ? formatDate(campaign.startDate) : "Ongoing"} —{" "}
                {campaign.endDate ? formatDate(campaign.endDate) : "Open"}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Tracker Section */}
        <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-white flex items-center gap-2">
              Deliverables Progress
              <span className="text-zinc-500 font-normal">
                ({progress.approved} of {progress.total} approved)
              </span>
            </span>
            <span className="font-semibold text-violet-400">{progress.percentage}% Complete</span>
          </div>

          <Progress value={progress.percentage} className="h-2 bg-white/5" />

          {/* Status Breakdown Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium text-[11px]">
              {progress.approved} Approved
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/20 font-medium text-[11px]">
              {progress.submitted} In Review
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium text-[11px]">
              {progress.revisionRequested} Revisions
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 font-medium text-[11px]">
              {progress.pending} Pending
            </span>
            {progress.overdue > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 font-medium text-[11px] flex items-center gap-1">
                <AlertTriangle className="size-3" />
                {progress.overdue} Overdue
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Deliverables Management Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="size-5 text-violet-400" />
              Campaign Deliverables
            </h2>
            <p className="text-xs text-zinc-400">
              Submit work, request revisions, and verify campaign requirements
            </p>
          </div>

          {isBrand && collaboration.status === "active" && (
            <Button
              size="sm"
              onClick={() => {
                setDeliverableForm({ title: "", description: "", dueDate: "" });
                setAddModalOpen(true);
              }}
              className="bg-violet-600 hover:bg-violet-500 text-white text-xs h-8 px-3 flex items-center gap-1.5"
            >
              <Plus className="size-3.5" />
              Add Deliverable
            </Button>
          )}
        </div>

        {/* Deliverables List */}
        {deliverables.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center space-y-3">
            <FileText className="size-8 text-zinc-500 mx-auto" />
            <h3 className="text-sm font-semibold text-white">No deliverables configured</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {isBrand
                ? "Configure the specific content items, due dates, and requirements for this collaboration."
                : "The brand has not configured deliverables for this partnership yet. Please check back soon."}
            </p>
            {isBrand && collaboration.status === "active" && (
              <Button
                size="sm"
                onClick={() => {
                  setDeliverableForm({ title: "", description: "", dueDate: "" });
                  setAddModalOpen(true);
                }}
                className="bg-violet-600 hover:bg-violet-500 text-white text-xs mt-2"
              >
                Add First Deliverable
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {deliverables.map((deliv, idx) => {
              const isOverdue = deliv.isOverdue;

              return (
                <div
                  key={deliv._id || idx}
                  className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-4 hover:border-white/20 transition-colors"
                >
                  {/* Deliverable Header */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-zinc-400">
                          Item #{idx + 1}
                        </span>
                        {deliv.dueDate && (
                          <>
                            <span className="text-zinc-600">•</span>
                            <span className="text-xs text-zinc-400 flex items-center gap-1">
                              <Calendar className="size-3 text-zinc-500" />
                              Due {formatDate(deliv.dueDate)}
                            </span>
                          </>
                        )}
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                            <AlertTriangle className="size-3" />
                            Overdue
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-semibold text-white">{deliv.title}</h3>
                      {deliv.description && (
                        <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed pt-0.5">
                          {deliv.description}
                        </p>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 shrink-0">
                      {deliv.status === "pending" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">
                          <Clock className="size-3" />
                          Pending Submission
                        </span>
                      )}
                      {deliv.status === "submitted" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-300 border border-blue-500/20">
                          <Clock className="size-3" />
                          Submitted for Review
                        </span>
                      )}
                      {deliv.status === "revision_requested" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          <RotateCw className="size-3" />
                          Revision Requested
                        </span>
                      )}
                      {deliv.status === "approved" && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          <CheckCircle2 className="size-3" />
                          Approved
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Submission Details Card */}
                  {deliv.submissionUrl && (
                    <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-zinc-400 flex items-center gap-1.5">
                          <ExternalLink className="size-3 text-violet-400" />
                          Submitted Work Link:
                        </span>
                        {deliv.submittedAt && (
                          <span className="text-[11px] text-zinc-500">
                            Submitted on {formatDateTime(deliv.submittedAt)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={
                            deliv.submissionUrl.startsWith("http")
                              ? deliv.submissionUrl
                              : `https://${deliv.submissionUrl}`
                          }
                          target="_blank"
                          rel="noreferrer"
                          className="text-violet-400 hover:text-violet-300 underline font-medium truncate max-w-xl"
                        >
                          {deliv.submissionUrl}
                        </a>
                      </div>

                      {deliv.submissionNotes && (
                        <div className="pt-1.5 text-zinc-300 border-t border-white/5">
                          <span className="text-zinc-500 block mb-0.5">Creator Notes:</span>
                          <p className="whitespace-pre-wrap">{deliv.submissionNotes}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Revision Feedback Card */}
                  {deliv.revisionFeedback && (
                    <div className="rounded-xl bg-amber-500/5 border border-amber-500/20 p-4 space-y-1.5 text-xs text-amber-200">
                      <div className="flex items-center justify-between font-semibold text-amber-300">
                        <span className="flex items-center gap-1.5">
                          <RotateCw className="size-3" />
                          Brand Revision Request:
                        </span>
                        {deliv.revisionRequestedAt && (
                          <span className="text-[11px] text-amber-400/80 font-normal">
                            {formatDateTime(deliv.revisionRequestedAt)}
                          </span>
                        )}
                      </div>
                      <p className="whitespace-pre-wrap text-zinc-300 pl-4">
                        {deliv.revisionFeedback}
                      </p>
                    </div>
                  )}

                  {/* Approved Info Card */}
                  {deliv.status === "approved" && deliv.approvedAt && (
                    <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-3 flex items-center justify-between text-xs text-emerald-300">
                      <span className="flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="size-3.5" />
                        Deliverable verified and approved
                      </span>
                      <span className="text-[11px] text-emerald-400/80">
                        Approved on {formatDateTime(deliv.approvedAt)}
                      </span>
                    </div>
                  )}

                  {/* Actions Row */}
                  <div className="flex items-center justify-between pt-2 border-t border-white/5">
                    {/* Brand management icons */}
                    <div className="flex items-center gap-1.5">
                      {isBrand && deliv.status !== "approved" && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedDeliverable(deliv);
                              setDeliverableForm({
                                title: deliv.title,
                                description: deliv.description || "",
                                dueDate: deliv.dueDate ? deliv.dueDate.split("T")[0] : "",
                              });
                              setEditModalOpen(true);
                            }}
                            className="text-zinc-400 hover:text-white text-xs h-7 px-2"
                          >
                            <Pencil className="size-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteDeliverable(deliv)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs h-7 px-2"
                          >
                            <Trash2 className="size-3 mr-1" />
                            Delete
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Operational Action Buttons */}
                    <div className="flex items-center gap-2">
                      {/* Creator actions */}
                      {isCreator && (deliv.status === "pending" || deliv.status === "revision_requested") && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedDeliverable(deliv);
                            setSubmitForm({
                              submissionUrl: deliv.submissionUrl || "",
                              submissionNotes: deliv.submissionNotes || "",
                            });
                            setSubmitModalOpen(true);
                          }}
                          className="bg-violet-600 hover:bg-violet-500 text-white text-xs h-8 px-3.5 flex items-center gap-1.5"
                        >
                          <Send className="size-3" />
                          {deliv.status === "revision_requested" ? "Resubmit Work" : "Submit Work"}
                        </Button>
                      )}

                      {/* Brand review actions */}
                      {isBrand && deliv.status === "submitted" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedDeliverable(deliv);
                              setRevisionFeedback("");
                              setRevisionModalOpen(true);
                            }}
                            className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 text-xs h-8 px-3"
                          >
                            Request Revision
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedDeliverable(deliv);
                              setApproveModalOpen(true);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 px-3 flex items-center gap-1.5"
                          >
                            <CheckCircle2 className="size-3.5" />
                            Approve
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* --- MODAL DIALOGS --- */}

      {/* 1. Add Deliverable Modal (Brand) */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Add Campaign Deliverable</DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Define a specific content deliverable and timeline for this collaboration.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddDeliverable} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Deliverable Title <span className="text-red-400">*</span>
              </label>
              <Input
                placeholder="e.g. 1 Instagram Reel (60s dedicated)"
                value={deliverableForm.title}
                onChange={(e) => setDeliverableForm({ ...deliverableForm, title: e.target.value })}
                className="bg-white/5 border-white/10 text-white text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Description & Instructions</label>
              <Textarea
                placeholder="Key requirements, brand guidelines, hashtags, or content points..."
                value={deliverableForm.description}
                onChange={(e) => setDeliverableForm({ ...deliverableForm, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white text-xs min-h-[90px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Due Date</label>
              <Input
                type="date"
                value={deliverableForm.dueDate}
                onChange={(e) => setDeliverableForm({ ...deliverableForm, dueDate: e.target.value })}
                className="bg-white/5 border-white/10 text-white text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setAddModalOpen(false)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={actionLoading}
                className="bg-violet-600 hover:bg-violet-500 text-white text-xs"
              >
                {actionLoading ? "Adding..." : "Add Deliverable"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Edit Deliverable Modal (Brand) */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Deliverable</DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Update deliverable details or due dates.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateDeliverable} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Deliverable Title <span className="text-red-400">*</span>
              </label>
              <Input
                value={deliverableForm.title}
                onChange={(e) => setDeliverableForm({ ...deliverableForm, title: e.target.value })}
                className="bg-white/5 border-white/10 text-white text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Description & Instructions</label>
              <Textarea
                value={deliverableForm.description}
                onChange={(e) => setDeliverableForm({ ...deliverableForm, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white text-xs min-h-[90px]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Due Date</label>
              <Input
                type="date"
                value={deliverableForm.dueDate}
                onChange={(e) => setDeliverableForm({ ...deliverableForm, dueDate: e.target.value })}
                className="bg-white/5 border-white/10 text-white text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setEditModalOpen(false)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={actionLoading}
                className="bg-violet-600 hover:bg-violet-500 text-white text-xs"
              >
                {actionLoading ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Submit / Resubmit Work Modal (Creator) */}
      <Dialog open={submitModalOpen} onOpenChange={setSubmitModalOpen}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDeliverable?.status === "revision_requested" ? "Resubmit Work" : "Submit Deliverable Work"}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Provide a link to your drafted or published work (e.g. Google Drive, YouTube Unlisted, Instagram post).
            </DialogDescription>
          </DialogHeader>

          {selectedDeliverable?.revisionFeedback && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-200">
              <span className="font-semibold block mb-0.5">Brand Revision Request:</span>
              <p>{selectedDeliverable.revisionFeedback}</p>
            </div>
          )}

          <form onSubmit={handleSubmitWork} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Work URL / Media Reference <span className="text-red-400">*</span>
              </label>
              <Input
                placeholder="https://drive.google.com/... or https://youtube.com/..."
                value={submitForm.submissionUrl}
                onChange={(e) => setSubmitForm({ ...submitForm, submissionUrl: e.target.value })}
                className="bg-white/5 border-white/10 text-white text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Submission Notes / Caption</label>
              <Textarea
                placeholder="Add any context, timestamps, or captions for the brand to review..."
                value={submitForm.submissionNotes}
                onChange={(e) => setSubmitForm({ ...submitForm, submissionNotes: e.target.value })}
                className="bg-white/5 border-white/10 text-white text-xs min-h-[80px]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSubmitModalOpen(false)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={actionLoading}
                className="bg-violet-600 hover:bg-violet-500 text-white text-xs"
              >
                {actionLoading ? "Submitting..." : "Submit for Review"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. Approve Confirmation Modal (Brand) */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="size-5" />
              Approve Deliverable?
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              You are about to mark <strong>{selectedDeliverable?.title}</strong> as approved.
              This will update the campaign progress.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setApproveModalOpen(false)}
              className="text-zinc-400 hover:text-white text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleApproveSubmission}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
            >
              {actionLoading ? "Approving..." : "Yes, Approve Deliverable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 5. Request Revision Modal (Brand) */}
      <Dialog open={revisionModalOpen} onOpenChange={setRevisionModalOpen}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <RotateCw className="size-5" />
              Request Revision
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Provide specific feedback explaining what changes the creator needs to make before approval.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRequestRevision} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Revision Feedback <span className="text-red-400">*</span>
              </label>
              <Textarea
                placeholder="Explain what needs adjustment (e.g. adjust lighting, fix caption, include required discount code)..."
                value={revisionFeedback}
                onChange={(e) => setRevisionFeedback(e.target.value)}
                className="bg-white/5 border-white/10 text-white text-xs min-h-[100px]"
                required
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setRevisionModalOpen(false)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={actionLoading}
                className="bg-amber-600 hover:bg-amber-500 text-white text-xs"
              >
                {actionLoading ? "Requesting..." : "Send Revision Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
