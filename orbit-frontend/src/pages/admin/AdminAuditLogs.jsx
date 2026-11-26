import { useState, useEffect } from "react";
import api from "@/lib/api";
import { ShieldCheckIcon, HistoryIcon, FilterIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AdminAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/admin/moderation-logs?page=${page}&limit=20`);
      setLogs(res.data.logs || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Failed to load moderation audit logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page]);

  return (
    <div className="container max-w-6xl py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <HistoryIcon className="h-6 w-6 text-primary" />
          Moderation & Admin Audit Logs
        </h1>
        <p className="text-sm text-muted-foreground">
          Immutable audit record of all administrative verifications, account suspensions, and moderation actions.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading audit logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No audit logs recorded yet.
            </div>
          ) : (
            <div className="divide-y overflow-x-auto">
              {logs.map((log) => (
                <div key={log._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {log.action}
                      </Badge>
                      <span className="font-medium text-foreground">
                        Target: {log.targetType} {log.targetId ? `(${log.targetId.slice(-6)})` : ""}
                      </span>
                    </div>
                    {log.reason && (
                      <p className="text-muted-foreground leading-relaxed">
                        Reason: {log.reason}
                      </p>
                    )}
                  </div>

                  <div className="text-right shrink-0 text-muted-foreground space-y-0.5">
                    <div>Admin: {log.adminId?.name || "System"}</div>
                    <div className="text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
          >
            Previous
          </Button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
