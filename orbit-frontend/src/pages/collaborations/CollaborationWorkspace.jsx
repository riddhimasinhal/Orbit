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
  CreditCard,
  ScrollText,
  ShieldCheck,
  History,
  XCircle,
  Check,
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
  const [contract, setContract] = useState(null);
  const [payments, setPayments] = useState([]);
  const [providerConfigured, setProviderConfigured] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Active view tab: "deliverables" | "contract" | "payments"
  const [activeTab, setActiveTab] = useState("deliverables");

  // Deliverable Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [revisionModalOpen, setRevisionModalOpen] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState(null);

  // Contract Modals state
  const [contractModalOpen, setContractModalOpen] = useState(false);
  const [acceptContractModalOpen, setAcceptContractModalOpen] = useState(false);
  const [rejectContractModalOpen, setRejectContractModalOpen] = useState(false);
  const [reviseContractModalOpen, setReviseContractModalOpen] = useState(false);
  const [contractHistoryOpen, setContractHistoryOpen] = useState(false);

  // Payment Modals state
  const [testPayModalOpen, setTestPayModalOpen] = useState(false);
  const [currentOrder, setCurrentOrder] = useState(null);

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

  const [contractForm, setContractForm] = useState({
    title: "",
    amount: "",
    currency: "INR",
    paymentTerms: "100% on successful completion and approval of all deliverables",
    termsAndConditions: "Deliverables must be original, meet agreed campaign guidelines, and be delivered on or before the agreed deadlines.",
    sendImmediate: false,
  });

  const [revisionForm, setRevisionForm] = useState({
    title: "",
    amount: "",
    currency: "INR",
    paymentTerms: "",
    termsAndConditions: "",
    note: "Updated compensation and campaign timeline",
    sendImmediate: true,
  });

  const [rejectionReason, setRejectionReason] = useState("");

  const role = localStorage.getItem("role") || "creator";
  const userId = localStorage.getItem("userId");

  const fetchWorkspace = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true);
      setError("");
      const [collabRes, contractRes, paymentRes] = await Promise.allSettled([
        api.get(`/collaborations/${collaborationId}`),
        api.get(`/contracts/collaboration/${collaborationId}`),
        api.get(`/payments/collaboration/${collaborationId}`),
      ]);

      if (collabRes.status === "fulfilled") {
        setCollaboration(collabRes.value.data.collaboration);
      } else {
        const err = collabRes.reason;
        if (err.response?.status === 403) {
          setError("You are not authorized to access this collaboration workspace.");
        } else if (err.response?.status === 404) {
          setError("Collaboration not found.");
        } else {
          setError(err.response?.data?.message || "Failed to load collaboration workspace.");
        }
      }

      if (contractRes.status === "fulfilled") {
        setContract(contractRes.value.data.contract);
      }

      if (paymentRes.status === "fulfilled") {
        setPayments(paymentRes.value.data.payments || []);
        setProviderConfigured(paymentRes.value.data.providerConfigured);
      }
    } catch {
      setError("An unexpected error occurred while loading the workspace.");
    } finally {
      setLoading(false);
    }
  }, [collaborationId]);

  useEffect(() => {
    let ignore = false;
    const load = async () => {
      try {
        const [collabRes, contractRes, paymentRes] = await Promise.allSettled([
          api.get(`/collaborations/${collaborationId}`),
          api.get(`/contracts/collaboration/${collaborationId}`),
          api.get(`/payments/collaboration/${collaborationId}`),
        ]);

        if (!ignore) {
          if (collabRes.status === "fulfilled") {
            setCollaboration(collabRes.value.data.collaboration);
          } else {
            const err = collabRes.reason;
            if (err.response?.status === 403) {
              setError("You are not authorized to access this collaboration workspace.");
            } else if (err.response?.status === 404) {
              setError("Collaboration not found.");
            } else {
              setError(err.response?.data?.message || "Failed to load collaboration workspace.");
            }
          }

          if (contractRes.status === "fulfilled") {
            setContract(contractRes.value.data.contract);
          }

          if (paymentRes.status === "fulfilled") {
            setPayments(paymentRes.value.data.payments || []);
            setProviderConfigured(paymentRes.value.data.providerConfigured);
          }
          setLoading(false);
        }
      } catch {
        if (!ignore) {
          setError("An error occurred while loading the workspace.");
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      ignore = true;
    };
  }, [collaborationId]);

  const formatDate = (dateString) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatCurrency = (amount, currency = "INR") => {
    if (amount === undefined || amount === null) return "—";
    const symbol = currency === "INR" ? "₹" : "$";
    return `${symbol}${Number(amount).toLocaleString()} ${currency}`;
  };

  // Handlers for Deliverables
  const handleAddDeliverable = async (e) => {
    e.preventDefault();
    if (!deliverableForm.title.trim()) {
      toast.error("Title is required");
      return;
    }

    try {
      setActionLoading(true);
      await api.post(`/collaborations/${collaborationId}/deliverables`, {
        title: deliverableForm.title.trim(),
        description: deliverableForm.description.trim(),
        dueDate: deliverableForm.dueDate || null,
      });
      toast.success("Deliverable added successfully!");
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
      toast.error("Title cannot be empty");
      return;
    }

    try {
      setActionLoading(true);
      await api.put(`/collaborations/${collaborationId}/deliverables/${selectedDeliverable._id}`, {
        title: deliverableForm.title.trim(),
        description: deliverableForm.description.trim(),
        dueDate: deliverableForm.dueDate || null,
      });
      toast.success("Deliverable updated!");
      setEditModalOpen(false);
      setSelectedDeliverable(null);
      await fetchWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update deliverable");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDeliverable = async (deliverableId) => {
    if (!confirm("Are you sure you want to remove this deliverable?")) return;

    try {
      setActionLoading(true);
      await api.delete(`/collaborations/${collaborationId}/deliverables/${deliverableId}`);
      toast.success("Deliverable removed");
      await fetchWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to remove deliverable");
    } finally {
      setActionLoading(false);
    }
  };

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

  const handleApproveSubmission = async () => {
    if (!selectedDeliverable) return;
    try {
      setActionLoading(true);
      await api.post(`/collaborations/${collaborationId}/deliverables/${selectedDeliverable._id}/approve`);
      toast.success("Deliverable approved!");
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
      toast.error("Revision feedback message is required");
      return;
    }

    try {
      setActionLoading(true);
      await api.post(`/collaborations/${collaborationId}/deliverables/${selectedDeliverable._id}/revision`, {
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

  // Handlers for Contracts
  const handleSaveContract = async (e) => {
    e.preventDefault();
    if (!contractForm.amount || Number(contractForm.amount) < 0) {
      toast.error("A valid positive amount is required");
      return;
    }

    try {
      setActionLoading(true);
      const res = await api.post(`/contracts/collaboration/${collaborationId}`, {
        title: contractForm.title.trim(),
        amount: Number(contractForm.amount),
        currency: contractForm.currency,
        paymentTerms: contractForm.paymentTerms.trim(),
        termsAndConditions: contractForm.termsAndConditions.trim(),
        sendImmediate: contractForm.sendImmediate,
      });
      toast.success(res.data.message || "Contract saved successfully!");
      setContractModalOpen(false);
      await fetchWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save contract");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendContract = async () => {
    if (!contract) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/contracts/${contract._id}/send`);
      toast.success(res.data.message || "Contract sent for acceptance!");
      await fetchWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send contract");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAcceptContract = async () => {
    if (!contract) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/contracts/${contract._id}/accept`);
      toast.success(res.data.message || "Contract acceptance recorded!");
      setAcceptContractModalOpen(false);
      await fetchWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to accept contract");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectContract = async (e) => {
    e.preventDefault();
    if (!contract) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/contracts/${contract._id}/reject`, {
        reason: rejectionReason.trim(),
      });
      toast.success(res.data.message || "Contract agreement rejected");
      setRejectContractModalOpen(false);
      setRejectionReason("");
      await fetchWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to reject contract");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReviseContract = async (e) => {
    e.preventDefault();
    if (!contract) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/contracts/${contract._id}/revise`, {
        title: revisionForm.title.trim() || contract.title,
        amount: Number(revisionForm.amount) || contract.compensation.amount,
        currency: revisionForm.currency || contract.compensation.currency,
        paymentTerms: revisionForm.paymentTerms.trim() || contract.paymentTerms,
        termsAndConditions: revisionForm.termsAndConditions.trim() || contract.termsAndConditions,
        note: revisionForm.note.trim(),
        sendImmediate: revisionForm.sendImmediate,
      });
      toast.success(res.data.message || "Contract revised!");
      setReviseContractModalOpen(false);
      await fetchWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to revise contract");
    } finally {
      setActionLoading(false);
    }
  };

  // Handlers for Payments
  const handleInitiatePayment = async () => {
    try {
      setActionLoading(true);
      const res = await api.post(`/payments/collaboration/${collaborationId}/initiate`);
      const { payment, orderId, isTestMode, razorpayKeyId } = res.data;

      if (isTestMode || !window.Razorpay) {
        // Safe test mode execution
        setCurrentOrder({
          payment,
          orderId,
          amount: payment.amount,
          currency: payment.currency,
          isTestMode,
        });
        setTestPayModalOpen(true);
      } else {
        // Live Razorpay Checkout
        const options = {
          key: razorpayKeyId,
          amount: payment.amount * 100,
          currency: payment.currency,
          name: "Orbit Marketplace",
          description: `Deliverables compensation for ${collaboration?.campaign?.title || "Campaign"}`,
          order_id: orderId,
          handler: async function (response) {
            try {
              await api.post("/payments/verify", {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              });
              toast.success("Payment verified and completed successfully!");
              await fetchWorkspace();
            } catch (err) {
              toast.error(err.response?.data?.message || "Payment verification failed");
            }
          },
          theme: { color: "#7c3aed" },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initiate payment");
    } finally {
      setActionLoading(false);
    }
  };

  const handleSimulatePaymentCompletion = async (success) => {
    if (!currentOrder) return;
    try {
      setActionLoading(true);
      if (success) {
        const mockPaymentId = `pay_test_${Date.now()}`;
        const res = await api.post("/payments/verify", {
          orderId: currentOrder.orderId,
          paymentId: mockPaymentId,
          signature: "orbit_test_signature",
        });
        toast.success(res.data.message || "Test payment completed!");
      } else {
        toast.info("Test payment was simulated as cancelled or failed.");
      }
      setTestPayModalOpen(false);
      setCurrentOrder(null);
      await fetchWorkspace();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error processing payment");
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
  const isBrand = role === "brand" || collaboration.brandId === userId;
  const isCreator = role === "creator" || collaboration.creatorId === userId;

  const isContractAccepted = contract?.status === "accepted";
  const userHasAcceptedContract = isBrand
    ? contract?.brandAcceptance?.accepted
    : contract?.creatorAcceptance?.accepted;

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
              Manage deliverables, sign contract agreement, and track milestone payments
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
              <p className="text-[11px] text-zinc-500">Agreed Compensation</p>
              <p className="text-sm font-semibold text-white">
                {contract?.compensation?.amount
                  ? formatCurrency(contract.compensation.amount, contract.compensation.currency)
                  : collaboration.application?.proposedBudget !== null &&
                    collaboration.application?.proposedBudget !== undefined
                  ? formatCurrency(collaboration.application.proposedBudget, "INR")
                  : "Awaiting Contract"}
              </p>
            </div>
          </div>

          {/* Contract / Payment Quick Status */}
          <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-full bg-blue-500/15 text-blue-300 shrink-0">
              <ShieldCheck className="size-4" />
            </div>
            <div>
              <p className="text-[11px] text-zinc-500">Contract & Payment</p>
              <p className="text-xs font-medium text-white">
                {isContractAccepted ? (
                  <span className="text-emerald-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="size-3" /> Contract Accepted
                  </span>
                ) : contract?.status === "sent" ? (
                  <span className="text-amber-400">Awaiting Acceptance</span>
                ) : (
                  <span className="text-zinc-400">Contract Draft Pending</span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Deliverables Progress Bar */}
        <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-white flex items-center gap-2">
              Deliverables Completion
              <span className="text-zinc-500 font-normal">
                ({progress.approved} of {progress.total} approved)
              </span>
            </span>
            <span className="font-semibold text-violet-400">{progress.percentage}% Complete</span>
          </div>
          <Progress value={progress.percentage} className="h-2 bg-white/5" />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab("deliverables")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "deliverables"
              ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <FileText className="size-4" />
          Deliverables ({deliverables.length})
        </button>

        <button
          onClick={() => setActiveTab("contract")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "contract"
              ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <ScrollText className="size-4" />
          Contract & Terms
          {contract && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                contract.status === "accepted"
                  ? "bg-emerald-500/20 text-emerald-300"
                  : contract.status === "sent"
                  ? "bg-amber-500/20 text-amber-300"
                  : "bg-zinc-500/20 text-zinc-300"
              }`}
            >
              v{contract.version} • {contract.status}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("payments")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
            activeTab === "payments"
              ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20"
              : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <CreditCard className="size-4" />
          Payments ({payments.length})
        </button>
      </div>

      {/* TAB 1: DELIVERABLES */}
      {activeTab === "deliverables" && (
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
                            <Send className="size-3" />
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

                    {/* Submission Information */}
                    {deliv.submissionUrl && (
                      <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3.5 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-zinc-400 font-medium flex items-center gap-1.5">
                            <ExternalLink className="size-3.5 text-violet-400" />
                            Submitted Work
                          </span>
                          {deliv.submittedAt && (
                            <span className="text-[11px] text-zinc-500">
                              Submitted {formatDate(deliv.submittedAt)}
                            </span>
                          )}
                        </div>
                        <a
                          href={deliv.submissionUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-violet-400 hover:text-violet-300 break-all underline flex items-center gap-1"
                        >
                          {deliv.submissionUrl}
                        </a>
                        {deliv.submissionNotes && (
                          <p className="text-zinc-300 pt-1 border-t border-white/5 whitespace-pre-wrap">
                            <span className="text-zinc-500 font-medium">Notes: </span>
                            {deliv.submissionNotes}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Revision Feedback Banner */}
                    {deliv.status === "revision_requested" && deliv.revisionFeedback && (
                      <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3.5 text-xs text-amber-200 space-y-1">
                        <span className="font-semibold flex items-center gap-1.5">
                          <RotateCw className="size-3.5 text-amber-400" />
                          Feedback from Brand:
                        </span>
                        <p className="whitespace-pre-wrap leading-relaxed">
                          {deliv.revisionFeedback}
                        </p>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        {isBrand && deliv.status !== "approved" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
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
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDeliverable(deliv._id)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 text-xs h-7 px-2"
                            >
                              <Trash2 className="size-3 mr-1" />
                              Delete
                            </Button>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isCreator &&
                          (deliv.status === "pending" || deliv.status === "revision_requested") && (
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
                              className="bg-violet-600 hover:bg-violet-500 text-white text-xs h-8"
                            >
                              <Send className="size-3 mr-1.5" />
                              {deliv.status === "revision_requested" ? "Resubmit Work" : "Submit Work"}
                            </Button>
                          )}

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
                              className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 text-xs h-8"
                            >
                              <RotateCw className="size-3 mr-1.5" />
                              Request Revision
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedDeliverable(deliv);
                                setApproveModalOpen(true);
                              }}
                              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
                            >
                              <CheckCircle2 className="size-3 mr-1.5" />
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
      )}

      {/* TAB 2: CONTRACT & TERMS */}
      {activeTab === "contract" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ScrollText className="size-5 text-violet-400" />
                Collaboration Contract & Legal Terms
              </h2>
              <p className="text-xs text-zinc-400">
                Formal commercial agreement, deliverable schedule, and authenticated bilateral acceptance
              </p>
            </div>

            <div className="flex items-center gap-2">
              {contract && contract.history?.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setContractHistoryOpen(!contractHistoryOpen)}
                  className="border-white/10 text-zinc-300 hover:text-white text-xs h-8"
                >
                  <History className="size-3.5 mr-1.5" />
                  Version History ({contract.history.length})
                </Button>
              )}

              {isBrand && !contract && (
                <Button
                  size="sm"
                  onClick={() => {
                    setContractForm({
                      title: `${campaign.title || "Campaign"} Collaboration Agreement`,
                      amount: String(collaboration.application?.proposedBudget || campaign.budgetMin || 5000),
                      currency: "INR",
                      paymentTerms: "100% on successful completion and approval of all deliverables",
                      termsAndConditions: "Deliverables must be original, meet agreed campaign guidelines, and be delivered on or before the agreed deadlines.",
                      sendImmediate: false,
                    });
                    setContractModalOpen(true);
                  }}
                  className="bg-violet-600 hover:bg-violet-500 text-white text-xs h-8 flex items-center gap-1.5"
                >
                  <Plus className="size-3.5" />
                  Draft Agreement
                </Button>
              )}

              {isBrand && contract && contract.status === "accepted" && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setRevisionForm({
                      title: contract.title,
                      amount: String(contract.compensation.amount),
                      currency: contract.compensation.currency,
                      paymentTerms: contract.paymentTerms,
                      termsAndConditions: contract.termsAndConditions,
                      note: "Revised contract terms",
                      sendImmediate: true,
                    });
                    setReviseContractModalOpen(true);
                  }}
                  className="border-violet-500/30 text-violet-300 hover:bg-violet-500/10 text-xs h-8"
                >
                  <Pencil className="size-3 mr-1.5" />
                  Revise Terms (New Version)
                </Button>
              )}
            </div>
          </div>

          {!contract ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center space-y-3">
              <ScrollText className="size-8 text-zinc-500 mx-auto" />
              <h3 className="text-sm font-semibold text-white">No contract has been drafted</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                {isBrand
                  ? "Formalize this collaboration by drafting an agreement with the agreed compensation, deliverables, and payment terms."
                  : "The brand has not drafted a formal contract agreement for this collaboration yet."}
              </p>
              {isBrand && (
                <Button
                  size="sm"
                  onClick={() => {
                    setContractForm({
                      title: `${campaign.title || "Campaign"} Collaboration Agreement`,
                      amount: String(collaboration.application?.proposedBudget || campaign.budgetMin || 5000),
                      currency: "INR",
                      paymentTerms: "100% on successful completion and approval of all deliverables",
                      termsAndConditions: "Deliverables must be original, meet agreed campaign guidelines, and be delivered on or before the agreed deadlines.",
                      sendImmediate: false,
                    });
                    setContractModalOpen(true);
                  }}
                  className="bg-violet-600 hover:bg-violet-500 text-white text-xs mt-2"
                >
                  Draft Agreement
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Acceptance Banner */}
              {isContractAccepted ? (
                <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center shrink-0">
                      <ShieldCheck className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-emerald-200">
                        Contract Fully Executed & Accepted
                      </h4>
                      <p className="text-xs text-emerald-300/80">
                        Version {contract.version} has been formally accepted by both parties. Milestone payments are now authorized.
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 uppercase tracking-wider">
                    Executed
                  </span>
                </div>
              ) : contract.status === "rejected" ? (
                <div className="rounded-2xl bg-red-500/10 border border-red-500/30 p-4 space-y-2">
                  <div className="flex items-center gap-2 text-red-300 text-sm font-semibold">
                    <XCircle className="size-4" />
                    Contract Proposal Rejected
                  </div>
                  <p className="text-xs text-red-300/80">
                    {contract.rejectionReason
                      ? `Reason: "${contract.rejectionReason}"`
                      : "The counterparty declined the proposed terms. The brand can revise the agreement."}
                  </p>
                  {isBrand && (
                    <Button
                      size="sm"
                      onClick={() => {
                        setRevisionForm({
                          title: contract.title,
                          amount: String(contract.compensation.amount),
                          currency: contract.compensation.currency,
                          paymentTerms: contract.paymentTerms,
                          termsAndConditions: contract.termsAndConditions,
                          note: "Updated after rejection",
                          sendImmediate: true,
                        });
                        setReviseContractModalOpen(true);
                      }}
                      className="bg-red-600 hover:bg-red-500 text-white text-xs h-7 mt-1"
                    >
                      Revise & Resend Agreement
                    </Button>
                  )}
                </div>
              ) : (
                <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0">
                      <Clock className="size-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-amber-200">
                        Contract Agreement Pending Acceptance (v{contract.version})
                      </h4>
                      <p className="text-xs text-amber-300/80">
                        {contract.status === "draft"
                          ? "This agreement is currently in draft. The brand must send it for creator review."
                          : "Both creator and brand must accept this version to finalize the agreement."}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {contract.status === "draft" && isBrand && (
                      <Button
                        size="sm"
                        onClick={handleSendContract}
                        disabled={actionLoading}
                        className="bg-violet-600 hover:bg-violet-500 text-white text-xs h-8"
                      >
                        <Send className="size-3.5 mr-1.5" />
                        Send Agreement
                      </Button>
                    )}

                    {contract.status === "sent" && !userHasAcceptedContract && (
                      <Button
                        size="sm"
                        onClick={() => setAcceptContractModalOpen(true)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 flex items-center gap-1.5"
                      >
                        <Check className="size-3.5" />
                        Accept Agreement
                      </Button>
                    )}

                    {contract.status === "sent" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setRejectContractModalOpen(true)}
                        className="border-red-500/30 text-red-300 hover:bg-red-500/10 text-xs h-8"
                      >
                        <XCircle className="size-3.5 mr-1" />
                        Reject
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Bilateral Acceptance Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Brand Acceptance Card */}
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[11px] text-zinc-500 font-medium uppercase">Brand Sign-off</p>
                    <p className="text-sm font-semibold text-white">
                      {contract.brandId?.name || "Brand Partner"}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {contract.brandAcceptance?.accepted
                        ? `Accepted on ${formatDate(contract.brandAcceptance.acceptedAt)}`
                        : "Awaiting Brand Acceptance"}
                    </p>
                  </div>
                  {contract.brandAcceptance?.accepted ? (
                    <span className="size-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Check className="size-4" />
                    </span>
                  ) : (
                    <span className="size-8 rounded-full bg-zinc-500/20 text-zinc-500 flex items-center justify-center">
                      <Clock className="size-4" />
                    </span>
                  )}
                </div>

                {/* Creator Acceptance Card */}
                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[11px] text-zinc-500 font-medium uppercase">Creator Sign-off</p>
                    <p className="text-sm font-semibold text-white">
                      {contract.creatorId?.name || "Creator Partner"}
                    </p>
                    <p className="text-xs text-zinc-400">
                      {contract.creatorAcceptance?.accepted
                        ? `Accepted on ${formatDate(contract.creatorAcceptance.acceptedAt)}`
                        : "Awaiting Creator Acceptance"}
                    </p>
                  </div>
                  {contract.creatorAcceptance?.accepted ? (
                    <span className="size-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Check className="size-4" />
                    </span>
                  ) : (
                    <span className="size-8 rounded-full bg-zinc-500/20 text-zinc-500 flex items-center justify-center">
                      <Clock className="size-4" />
                    </span>
                  )}
                </div>
              </div>

              {/* Main Contract Agreement Paper */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 space-y-6">
                <div className="border-b border-white/10 pb-4 flex items-start justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white tracking-tight">{contract.title}</h3>
                    <p className="text-xs text-zinc-400 mt-1">
                      Contract Version {contract.version} • Created {formatDate(contract.createdAt)}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-emerald-400">
                    {formatCurrency(contract.compensation.amount, contract.compensation.currency)}
                  </span>
                </div>

                {/* Section 1: Compensation & Terms */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    1. Compensation & Payment Schedule
                  </h4>
                  <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 text-xs text-zinc-300 space-y-1.5">
                    <p>
                      <strong className="text-white">Agreed Total:</strong>{" "}
                      {formatCurrency(contract.compensation.amount, contract.compensation.currency)}
                    </p>
                    <p>
                      <strong className="text-white">Payment Terms:</strong> {contract.paymentTerms}
                    </p>
                  </div>
                </div>

                {/* Section 2: Snapshotted Deliverables */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    2. Agreed Deliverables & Deadlines
                  </h4>
                  <div className="space-y-2">
                    {contract.deliverables?.map((d, i) => (
                      <div
                        key={i}
                        className="rounded-xl bg-white/[0.02] border border-white/5 p-3 flex items-start justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="font-semibold text-white">
                            {i + 1}. {d.title}
                          </p>
                          {d.description && <p className="text-zinc-400">{d.description}</p>}
                        </div>
                        {d.dueDate && (
                          <span className="text-zinc-400 shrink-0 ml-4 font-mono">
                            Due {formatDate(d.dueDate)}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Terms and Conditions */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    3. Commercial Terms & Guidelines
                  </h4>
                  <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {contract.termsAndConditions}
                  </div>
                </div>
              </div>

              {/* Version History Drawer */}
              {contractHistoryOpen && contract.history?.length > 0 && (
                <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <History className="size-4 text-violet-400" />
                    Modification & Revision Audit Trail
                  </h4>
                  <div className="space-y-2">
                    {contract.history.map((hist, idx) => (
                      <div
                        key={idx}
                        className="rounded-xl bg-white/[0.02] border border-white/5 p-3 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-zinc-400">
                          <span className="font-semibold text-zinc-200">
                            Version {hist.version} (Archived)
                          </span>
                          <span>{formatDate(hist.modifiedAt)}</span>
                        </div>
                        <p className="text-zinc-300">
                          Amount: {formatCurrency(hist.compensation?.amount, hist.compensation?.currency)}
                        </p>
                        {hist.note && <p className="text-zinc-500 italic">"{hist.note}"</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PAYMENTS */}
      {activeTab === "payments" && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <CreditCard className="size-5 text-violet-400" />
                Payments & Escrow Transactions
              </h2>
              <p className="text-xs text-zinc-400">
                Secure Razorpay milestone settlements, verified webhook receipts, and payment logs
              </p>
            </div>

            {isBrand && (
              <Button
                size="sm"
                onClick={handleInitiatePayment}
                disabled={!isContractAccepted || actionLoading}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 flex items-center gap-1.5"
                title={!isContractAccepted ? "Contract must be accepted first" : "Initiate Payment"}
              >
                <DollarSign className="size-3.5" />
                Pay Creator ({contract?.compensation?.amount ? formatCurrency(contract.compensation.amount, contract.compensation.currency) : "—"})
              </Button>
            )}
          </div>

          {/* Gateway Status Notice */}
          <div className="rounded-xl bg-white/[0.02] border border-white/5 p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-300">
                Payment Provider: <strong className="text-white">Razorpay (Indian-Market Gateway)</strong>
              </span>
            </div>
            <span className="text-zinc-500 text-[11px]">
              {providerConfigured ? "Live Gateway Active" : "Test / Sandbox Mode Active"}
            </span>
          </div>

          {!isContractAccepted && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-5 text-amber-200 text-xs flex items-start gap-3">
              <AlertTriangle className="size-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-amber-100">Contract Acceptance Required</strong>
                <p className="mt-0.5 text-amber-300/80">
                  Payments cannot be initiated until both creator and brand have accepted the collaboration agreement in the Contract tab.
                </p>
              </div>
            </div>
          )}

          {/* Transactions List */}
          {payments.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.01] p-12 text-center space-y-3">
              <CreditCard className="size-8 text-zinc-500 mx-auto" />
              <h3 className="text-sm font-semibold text-white">No payment transactions yet</h3>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Once the contract is accepted by both parties, the brand can initiate payments directly through the workspace.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-zinc-300">
                  <thead className="bg-white/5 text-zinc-400 font-semibold border-b border-white/10">
                    <tr>
                      <th className="p-3.5">Date</th>
                      <th className="p-3.5">Order ID</th>
                      <th className="p-3.5">Payment ID</th>
                      <th className="p-3.5">Amount</th>
                      <th className="p-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {payments.map((p) => (
                      <tr key={p._id} className="hover:bg-white/[0.02]">
                        <td className="p-3.5 text-zinc-400">{formatDate(p.createdAt)}</td>
                        <td className="p-3.5 font-mono text-[11px] text-zinc-300">{p.orderId}</td>
                        <td className="p-3.5 font-mono text-[11px] text-zinc-400">
                          {p.paymentId || "—"}
                        </td>
                        <td className="p-3.5 font-semibold text-white">
                          {formatCurrency(p.amount, p.currency)}
                        </td>
                        <td className="p-3.5">
                          {p.status === "successful" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="size-3" />
                              Successful
                            </span>
                          )}
                          {p.status === "pending" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Clock className="size-3" />
                              Pending
                            </span>
                          )}
                          {p.status === "failed" && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-400 border border-red-500/20">
                              <XCircle className="size-3" />
                              Failed
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. Add Deliverable Modal (Brand) */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Add Campaign Deliverable</DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Define the requirements, title, and optional deadline for this deliverable.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddDeliverable} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Title <span className="text-red-400">*</span>
              </label>
              <Input
                placeholder="e.g. 1x Dedicated YouTube Review (8-10 mins)"
                value={deliverableForm.title}
                onChange={(e) => setDeliverableForm({ ...deliverableForm, title: e.target.value })}
                className="bg-white/5 border-white/10 text-white text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Description / Instructions</label>
              <Textarea
                placeholder="Include talking points, product features, and key guidelines..."
                value={deliverableForm.description}
                onChange={(e) => setDeliverableForm({ ...deliverableForm, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white text-xs min-h-[80px]"
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
              Update deliverable details, requirements, or deadline.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateDeliverable} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Title <span className="text-red-400">*</span>
              </label>
              <Input
                value={deliverableForm.title}
                onChange={(e) => setDeliverableForm({ ...deliverableForm, title: e.target.value })}
                className="bg-white/5 border-white/10 text-white text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Description / Instructions</label>
              <Textarea
                value={deliverableForm.description}
                onChange={(e) => setDeliverableForm({ ...deliverableForm, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white text-xs min-h-[80px]"
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

      {/* 3. Submit Work Modal (Creator) */}
      <Dialog open={submitModalOpen} onOpenChange={setSubmitModalOpen}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedDeliverable?.status === "revision_requested" ? "Resubmit Work" : "Submit Deliverable Work"}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Provide a link to your drafted or published work (e.g. Google Drive, YouTube link).
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
                placeholder="https://youtube.com/... or https://drive.google.com/..."
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

      {/* 4. Approve Modal (Brand) */}
      <Dialog open={approveModalOpen} onOpenChange={setApproveModalOpen}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="size-5" />
              Approve Deliverable?
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              You are about to mark <strong>{selectedDeliverable?.title}</strong> as approved.
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

      {/* 5. Revision Modal (Brand) */}
      <Dialog open={revisionModalOpen} onOpenChange={setRevisionModalOpen}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-400">
              <RotateCw className="size-5" />
              Request Revision
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Provide feedback explaining what adjustments the creator needs to make.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRequestRevision} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">
                Revision Feedback <span className="text-red-400">*</span>
              </label>
              <Textarea
                placeholder="Explain what needs adjustment..."
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

      {/* 6. Draft Contract Modal (Brand) */}
      <Dialog open={contractModalOpen} onOpenChange={setContractModalOpen}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <ScrollText className="size-5 text-violet-400" />
              Draft Collaboration Contract
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Formalize commercial terms, agreed compensation, and conditions for this campaign.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveContract} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Contract Title</label>
              <Input
                value={contractForm.title}
                onChange={(e) => setContractForm({ ...contractForm, title: e.target.value })}
                className="bg-white/5 border-white/10 text-white text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Compensation Amount</label>
                <Input
                  type="number"
                  min="0"
                  value={contractForm.amount}
                  onChange={(e) => setContractForm({ ...contractForm, amount: e.target.value })}
                  className="bg-white/5 border-white/10 text-white text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Currency</label>
                <Input
                  value={contractForm.currency}
                  onChange={(e) => setContractForm({ ...contractForm, currency: e.target.value.toUpperCase() })}
                  className="bg-white/5 border-white/10 text-white text-xs font-mono uppercase"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Payment Terms</label>
              <Input
                value={contractForm.paymentTerms}
                onChange={(e) => setContractForm({ ...contractForm, paymentTerms: e.target.value })}
                className="bg-white/5 border-white/10 text-white text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Standard Terms & Conditions</label>
              <Textarea
                value={contractForm.termsAndConditions}
                onChange={(e) => setContractForm({ ...contractForm, termsAndConditions: e.target.value })}
                className="bg-white/5 border-white/10 text-white text-xs min-h-[80px]"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="sendImmediate"
                checked={contractForm.sendImmediate}
                onChange={(e) => setContractForm({ ...contractForm, sendImmediate: e.target.checked })}
                className="rounded border-white/20 bg-white/5 text-violet-600 focus:ring-0"
              />
              <label htmlFor="sendImmediate" className="text-xs text-zinc-300">
                Send immediately for creator acceptance upon saving
              </label>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setContractModalOpen(false)}
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
                {actionLoading ? "Saving..." : "Save Contract"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 7. Accept Contract Confirmation Modal */}
      <Dialog open={acceptContractModalOpen} onOpenChange={setAcceptContractModalOpen}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-400">
              <Check className="size-5" />
              Accept Collaboration Agreement?
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              By confirming, you formally accept <strong>Version {contract?.version}</strong> of this agreement.
              Your acceptance will be permanently recorded with an authenticated timestamp.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3.5 text-xs text-zinc-300 space-y-1">
            <p>
              <strong>Agreed Compensation:</strong>{" "}
              {contract && formatCurrency(contract.compensation.amount, contract.compensation.currency)}
            </p>
            <p>
              <strong>Payment Terms:</strong> {contract?.paymentTerms}
            </p>
          </div>

          <DialogFooter className="pt-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setAcceptContractModalOpen(false)}
              className="text-zinc-400 hover:text-white text-xs"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAcceptContract}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
            >
              {actionLoading ? "Accepting..." : "Yes, Sign & Accept Agreement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 8. Reject Contract Modal */}
      <Dialog open={rejectContractModalOpen} onOpenChange={setRejectContractModalOpen}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <XCircle className="size-5" />
              Decline Contract Agreement
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Let the other party know why you are declining these terms.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRejectContract} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Reason / Notes (Optional)</label>
              <Textarea
                placeholder="e.g. Compensation doesn't match agreed rate, deliverables require adjustment..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="bg-white/5 border-white/10 text-white text-xs min-h-[90px]"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setRejectContractModalOpen(false)}
                className="text-zinc-400 hover:text-white text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={actionLoading}
                className="bg-red-600 hover:bg-red-500 text-white text-xs"
              >
                {actionLoading ? "Rejecting..." : "Decline Agreement"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 9. Revise Contract Modal (Brand) */}
      <Dialog open={reviseContractModalOpen} onOpenChange={setReviseContractModalOpen}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Pencil className="size-5 text-violet-400" />
              Revise Contract Agreement (Version {contract ? contract.version + 1 : 2})
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Modifying an agreement creates a new version. Both parties must accept the new version.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleReviseContract} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Contract Title</label>
              <Input
                value={revisionForm.title}
                onChange={(e) => setRevisionForm({ ...revisionForm, title: e.target.value })}
                className="bg-white/5 border-white/10 text-white text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Revised Compensation</label>
                <Input
                  type="number"
                  min="0"
                  value={revisionForm.amount}
                  onChange={(e) => setRevisionForm({ ...revisionForm, amount: e.target.value })}
                  className="bg-white/5 border-white/10 text-white text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-zinc-300">Currency</label>
                <Input
                  value={revisionForm.currency}
                  onChange={(e) => setRevisionForm({ ...revisionForm, currency: e.target.value.toUpperCase() })}
                  className="bg-white/5 border-white/10 text-white text-xs font-mono uppercase"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Payment Terms</label>
              <Input
                value={revisionForm.paymentTerms}
                onChange={(e) => setRevisionForm({ ...revisionForm, paymentTerms: e.target.value })}
                className="bg-white/5 border-white/10 text-white text-xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-300">Revision Note for Audit Log</label>
              <Input
                placeholder="e.g. Added bonus budget, adjusted delivery schedule"
                value={revisionForm.note}
                onChange={(e) => setRevisionForm({ ...revisionForm, note: e.target.value })}
                className="bg-white/5 border-white/10 text-white text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setReviseContractModalOpen(false)}
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
                {actionLoading ? "Saving..." : "Create Revised Version"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 10. Simulated Payment Gateway Modal */}
      <Dialog open={testPayModalOpen} onOpenChange={setTestPayModalOpen}>
        <DialogContent className="bg-zinc-900 border-white/10 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <CreditCard className="size-5 text-emerald-400" />
              Razorpay Sandbox / Test Checkout
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-xs">
              Live credentials are not configured. You can simulate the gateway response in test mode.
            </DialogDescription>
          </DialogHeader>

          {currentOrder && (
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-4 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-zinc-400">Order ID:</span>
                <span className="font-mono text-white">{currentOrder.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Payable Amount:</span>
                <span className="font-bold text-emerald-400">
                  {formatCurrency(currentOrder.amount, currentOrder.currency)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-400">Recipient:</span>
                <span className="text-white">{creator.name || "Creator"}</span>
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleSimulatePaymentCompletion(false)}
              className="border-red-500/30 text-red-300 hover:bg-red-500/10 text-xs"
            >
              Simulate Failure
            </Button>
            <Button
              onClick={() => handleSimulatePaymentCompletion(true)}
              disabled={actionLoading}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs"
            >
              {actionLoading ? "Processing..." : "Simulate Successful Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
