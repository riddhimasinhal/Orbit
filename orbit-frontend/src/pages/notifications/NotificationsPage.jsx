import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import {
  BellIcon,
  CheckIcon,
  Trash2Icon,
  CheckCheckIcon,
  FilterIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // 'all' | 'unread'
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const isReadParam = filter === "unread" ? "&isRead=false" : "";
      const res = await api.get(`/notifications?page=${page}&limit=15${isReadParam}`);
      setNotifications(res.data.notifications || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
      setUnreadCount(res.data.unreadCount || 0);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter, page]);

  const handleMarkAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch {
      // ignore
    }
  };

  const handleClickItem = (item) => {
    if (!item.isRead) {
      handleMarkAsRead(item._id);
    }
    if (item.link) {
      navigate(item.link);
    }
  };

  return (
    <div className="container max-w-4xl py-6 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <BellIcon className="h-6 w-6 text-primary" />
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground">
            Stay updated on your connection requests, campaigns, deliverables, and payments.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllRead}
              className="text-xs"
            >
              <CheckCheckIcon className="h-4 w-4 mr-1.5" />
              Mark all as read
            </Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 border-b pb-3">
        <Button
          variant={filter === "all" ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            setFilter("all");
            setPage(1);
          }}
          className="text-xs"
        >
          All
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "ghost"}
          size="sm"
          onClick={() => {
            setFilter("unread");
            setPage(1);
          }}
          className="text-xs flex items-center gap-1.5"
        >
          Unread
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          Loading notifications...
        </div>
      ) : notifications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center space-y-2">
            <BellIcon className="h-10 w-10 text-muted-foreground/50 mx-auto" />
            <h3 className="font-medium text-base">No notifications</h3>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              {filter === "unread"
                ? "You have caught up with all your unread notifications."
                : "You don't have any activity notifications yet."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((item) => (
            <div
              key={item._id}
              onClick={() => handleClickItem(item)}
              className={`flex items-start gap-4 p-4 rounded-lg border transition-all cursor-pointer hover:shadow-xs ${
                !item.isRead
                  ? "bg-card border-primary/20 shadow-xs"
                  : "bg-muted/15 border-border opacity-90"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-semibold truncate text-foreground">
                    {item.title}
                  </h4>
                  {!item.isRead && (
                    <span className="h-2 w-2 rounded-full bg-blue-600 block shrink-0" />
                  )}
                  <span className="text-xs text-muted-foreground ml-auto shrink-0">
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.message}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                {!item.isRead && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    onClick={() => handleMarkAsRead(item._id)}
                    title="Mark as read"
                  >
                    <CheckIcon className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(item._id)}
                  title="Delete notification"
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
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
      )}
    </div>
  );
}
