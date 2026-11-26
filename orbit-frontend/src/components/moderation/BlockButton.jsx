import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BanIcon, ShieldAlertIcon } from "lucide-react";

export function BlockButton({
  targetUserId,
  targetUserName = "this user",
  onStatusChange,
  variant = "outline",
  size = "sm",
}) {
  const [isBlocked, setIsBlocked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState("");

  const checkStatus = async () => {
    if (!targetUserId) return;
    try {
      const res = await api.get(`/blocks/check/${targetUserId}`);
      setIsBlocked(Boolean(res.data?.blockedByMe));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    checkStatus();
  }, [targetUserId]);

  const handleToggleBlock = async () => {
    if (!targetUserId) return;
    setLoading(true);
    setError("");

    try {
      if (isBlocked) {
        await api.delete(`/blocks/${targetUserId}`);
        setIsBlocked(false);
        if (onStatusChange) onStatusChange(false);
      } else {
        await api.post(`/blocks/${targetUserId}`, { reason: "User blocked from profile" });
        setIsBlocked(true);
        if (onStatusChange) onStatusChange(true);
      }
      setDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update block status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant={isBlocked ? "secondary" : variant}
        size={size}
        onClick={() => setDialogOpen(true)}
        className={isBlocked ? "text-destructive border-destructive/30" : "text-muted-foreground hover:text-destructive"}
      >
        <BanIcon className="h-4 w-4 mr-1.5" />
        {isBlocked ? "Blocked" : "Block"}
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldAlertIcon className="h-5 w-5 text-destructive" />
              {isBlocked ? `Unblock ${targetUserName}?` : `Block ${targetUserName}?`}
            </DialogTitle>
            <DialogDescription>
              {isBlocked
                ? `Unblocking will allow ${targetUserName} to send you connection requests and messages again.`
                : `Blocking ${targetUserName} prevents them from sending connection requests, direct messages, or initiating collaborations with you. Existing history remains safe.`}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="p-3 text-xs bg-destructive/10 text-destructive rounded-md">
              {error}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant={isBlocked ? "default" : "destructive"}
              size="sm"
              onClick={handleToggleBlock}
              disabled={loading}
            >
              {loading
                ? isBlocked
                  ? "Unblocking..."
                  : "Blocking..."
                : isBlocked
                ? "Yes, Unblock"
                : "Yes, Block User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
