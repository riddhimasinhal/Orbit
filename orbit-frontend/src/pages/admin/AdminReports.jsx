import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  FileWarningIcon,
  ShieldCheckIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  XCircleIcon,
  SearchIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Review modal state
  const [selectedReport, setSelectedReport] = useState(null);
  const [resolutionAction, setResolutionAction] = useState("none");
  const [resolutionText, setResolutionText] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const statusParam = statusFilter !== "all" ? `&status=${statusFilter}` : "";
      const res = await api.get(`/reports/admin/all?page=${page}&limit=12${statusParam}`);
      setReports(res.data.reports || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter, page]);

  const handleOpenReview = (report) => {
    setSelectedReport(report);
    setResolutionAction(report.resolutionAction || "none");
    setResolutionText(report.resolution || "");
  };

  const handleResolve = async (newStatus) => {
    if (!selectedReport) return;
    try {
      setActionLoading(true);
      await api.patch(`/reports/admin/${selectedReport._id}/status`, {
        status: newStatus,
        resolution: resolutionText.trim(),
        resolutionAction,
      });

      // If action is user_suspended, trigger suspend on that user
      if (resolutionAction === "user_suspended" && selectedReport.reportedUser?._id) {
        try {
          await api.patch(`/admin/users/${selectedReport.reportedUser._id}/suspend`, {
            reason: `Suspended via moderation report #${selectedReport._id}: ${resolutionText.trim() || selectedReport.reason}`,
          });
        } catch {
          // ignore if already suspended
        }
      }

      setSelectedReport(null);
      fetchReports();
    } catch (err) {
      console.error("Failed to update report status:", err);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="container max-w-6xl py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <FileWarningIcon className="h-6 w-6 text-destructive" />
          Trust & Safety — Content Reports
        </h1>
        <p className="text-sm text-muted-foreground">
          Review community reports regarding violations of community guidelines, fraud, and misconduct.
        </p>
      </div>

      <div className="flex items-center gap-2 border-b pb-3">
        {["pending", "under_review", "resolved", "dismissed", "all"].map((st) => (
          <Button
            key={st}
            variant={statusFilter === st ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              setStatusFilter(st);
              setPage(1);
            }}
            className="text-xs capitalize"
          >
            {st.replace("_", " ")}
          </Button>
        ))}
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Loading moderation reports...
        </div>
      ) : reports.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-2">
            <CheckCircle2Icon className="h-10 w-10 text-emerald-600/50 mx-auto" />
            <h3 className="font-medium text-base">Queue is clear</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              No reports found with status &quot;{statusFilter}&quot;.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map((r) => {
            const reporter = r.reporter;
            const reported = r.reportedUser;

            return (
              <Card key={r._id} className="relative hover:shadow-xs transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <Badge
                      variant={
                        r.status === "resolved"
                          ? "default"
                          : r.status === "pending"
                          ? "destructive"
                          : "outline"
                      }
                      className="text-[11px] capitalize"
                    >
                      {r.status.replace("_", " ")}
                    </Badge>
                    <span className="text-[11px] text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <CardTitle className="text-sm font-semibold mt-2">
                    Reason: <span className="text-destructive capitalize">{r.reason.replace("_", " ")}</span>
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Target: <span className="font-mono">{r.targetType}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <div className="bg-muted/40 p-2.5 rounded-md space-y-1">
                    <div className="text-muted-foreground">
                      <strong>Reported user:</strong> {reported?.name || "Unknown"} ({reported?.role || "user"})
                    </div>
                    <div className="text-muted-foreground">
                      <strong>Submitted by:</strong> {reporter?.name || "Unknown"} ({reporter?.email || "anonymous"})
                    </div>
                  </div>

                  {r.description && (
                    <div className="p-2.5 rounded-md bg-card border text-muted-foreground italic">
                      &quot;{r.description}&quot;
                    </div>
                  )}

                  {r.resolution && (
                    <div className="text-xs text-muted-foreground border-t pt-2">
                      <strong>Resolution:</strong> {r.resolution} ({r.resolutionAction})
                    </div>
                  )}

                  <div className="pt-2 flex justify-end">
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs"
                      onClick={() => handleOpenReview(r)}
                    >
                      {r.status === "resolved" || r.status === "dismissed" ? "View Details" : "Review & Action"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Review & Resolution Dialog */}
      <Dialog open={Boolean(selectedReport)} onOpenChange={() => setSelectedReport(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="h-5 w-5 text-amber-500" />
              Review Moderation Report
            </DialogTitle>
            <DialogDescription>
              Take moderation action or dismiss this report after reviewing evidence.
            </DialogDescription>
          </DialogHeader>

          {selectedReport && (
            <div className="space-y-4 py-2 text-sm">
              <div className="bg-muted/30 p-3 rounded-md space-y-1 text-xs">
                <div><strong>Reported User:</strong> {selectedReport.reportedUser?.name} ({selectedReport.reportedUser?.email})</div>
                <div><strong>Report Reason:</strong> {selectedReport.reason}</div>
                <div><strong>Target Type:</strong> {selectedReport.targetType}</div>
                {selectedReport.description && (
                  <div className="mt-1"><strong>Details:</strong> {selectedReport.description}</div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="res-action" className="text-xs font-semibold">
                  Action to take
                </Label>
                <select
                  id="res-action"
                  value={resolutionAction}
                  onChange={(e) => setResolutionAction(e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="none">No penalty (Resolve without action)</option>
                  <option value="user_warned">Issue formal warning to user</option>
                  <option value="content_removed">Remove flagged content</option>
                  <option value="user_suspended">Suspend user account immediately</option>
                  <option value="dismissed">Dismiss report as unfounded</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="res-text" className="text-xs font-semibold">
                  Resolution notes (internal audit log)
                </Label>
                <Textarea
                  id="res-text"
                  placeholder="Record summary of investigation and reason for action..."
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  rows={3}
                  className="text-xs resize-none"
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResolve("dismissed")}
                  disabled={actionLoading}
                >
                  Dismiss Report
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleResolve("resolved")}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Processing..." : "Resolve with Action"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
