import { useState, useEffect } from "react";
import api from "@/lib/api";
import { BanIcon, UserXIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function BlockedUsers() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState(null);

  const fetchBlocked = async () => {
    try {
      setLoading(true);
      const res = await api.get("/blocks");
      setBlocks(res.data.blocks || []);
    } catch (err) {
      console.error("Failed to fetch blocked users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlocked();
  }, []);

  const handleUnblock = async (targetUserId) => {
    try {
      setUnblockingId(targetUserId);
      await api.delete(`/blocks/${targetUserId}`);
      setBlocks((prev) => prev.filter((b) => b.blockedUser?._id !== targetUserId));
    } catch (err) {
      console.error("Failed to unblock user:", err);
    } finally {
      setUnblockingId(null);
    }
  };

  return (
    <div className="container max-w-4xl py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <BanIcon className="h-6 w-6 text-destructive" />
          Blocked Users
        </h1>
        <p className="text-sm text-muted-foreground">
          Users you block cannot send connection requests, message you, or see your activity.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Blocked Accounts</CardTitle>
          <CardDescription>
            You can unblock an account at any time to resume normal interactions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading blocked users...
            </div>
          ) : blocks.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <UserXIcon className="h-10 w-10 text-muted-foreground/40 mx-auto" />
              <h3 className="font-medium text-base">No blocked users</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                You haven't blocked any accounts. If you encounter harassment or spam, you can block users from their profile.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {blocks.map((item) => {
                const u = item.blockedUser;
                const targetId = u?._id;
                const isUnblocking = unblockingId === targetId;

                return (
                  <div
                    key={item._id}
                    className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={u?.profileImage} />
                        <AvatarFallback>{u?.name?.slice(0, 2)?.toUpperCase() || "U"}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="text-sm font-semibold">{u?.name || "User"}</h4>
                        <p className="text-xs text-muted-foreground capitalize">
                          {u?.role} • Blocked on{" "}
                          {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleUnblock(targetId)}
                      disabled={isUnblocking}
                      className="text-xs"
                    >
                      {isUnblocking ? "Unblocking..." : "Unblock"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
