import { useState } from "react";
import api from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircleIcon, CheckCircle2Icon } from "lucide-react";

const REPORT_REASONS = [
  { value: "spam", label: "Spam or unsolicited advertising" },
  { value: "harassment", label: "Harassment, abuse, or offensive conduct" },
  { value: "inappropriate_content", label: "Inappropriate or adult content" },
  { value: "scam_fraud", label: "Scam, payment fraud, or misleading deal" },
  { value: "impersonation", label: "Impersonation or fake profile" },
  { value: "terms_violation", label: "Terms of service violation" },
  { value: "other", label: "Other issue" },
];

export function ReportModal({
  isOpen,
  onClose,
  reportedUserId,
  reportedUserName = "this user",
  targetType = "user",
  targetId,
}) {
  const [reason, setReason] = useState("spam");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await api.post("/reports", {
        reportedUserId,
        targetType,
        targetId: targetId || reportedUserId,
        reason,
        description: description.trim(),
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDescription("");
        setReason("spam");
        onClose();
      }, 1800);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to submit report. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertCircleIcon className="h-5 w-5" />
            Report {reportedUserName}
          </DialogTitle>
          <DialogDescription>
            Help keep Orbit safe and trustworthy. Our moderation team reviews every submitted report.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2Icon className="h-10 w-10 text-green-600 mx-auto" />
            <h3 className="font-semibold text-base">Report Submitted</h3>
            <p className="text-sm text-muted-foreground">
              Thank you for reporting this issue. We will review it shortly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {error && (
              <div className="p-3 text-xs bg-destructive/10 text-destructive rounded-md border border-destructive/20">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="report-reason" className="text-xs font-semibold">
                Reason for report
              </Label>
              <select
                id="report-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
              >
                {REPORT_REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="report-description" className="text-xs font-semibold">
                Additional details (optional)
              </Label>
              <Textarea
                id="report-description"
                placeholder="Provide any relevant context, links, or specifics..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="text-sm resize-none"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={onClose}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={submitting}
              >
                {submitting ? "Submitting..." : "Submit Report"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
