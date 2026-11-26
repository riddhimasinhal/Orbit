import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  UsersIcon,
  SearchIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  UserCheckIcon,
  UserXIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Suspend modal state
  const [userToSuspend, setUserToSuspend] = useState(null);
  const [suspendReason, setSuspendReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page, limit: 15 });
      if (search.trim()) params.append("search", search.trim());
      if (roleFilter !== "all") params.append("role", roleFilter);
      if (statusFilter !== "all") params.append("status", statusFilter);

      const res = await api.get(`/admin/users?${params.toString()}`);
      setUsers(res.data.users || []);
      setTotalPages(res.data.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter, statusFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleSuspendSubmit = async () => {
    if (!userToSuspend || !suspendReason.trim()) {
      setErrorMsg("Please specify a suspension reason");
      return;
    }

    try {
      setActionLoading(true);
      setErrorMsg("");
      await api.patch(`/admin/users/${userToSuspend._id}/suspend`, {
        reason: suspendReason.trim(),
      });
      setUserToSuspend(null);
      setSuspendReason("");
      fetchUsers();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Failed to suspend user");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReactivate = async (userId) => {
    try {
      await api.patch(`/admin/users/${userId}/reactivate`);
      fetchUsers();
    } catch (err) {
      console.error("Failed to reactivate user:", err);
    }
  };

  return (
    <div className="container max-w-6xl py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <UsersIcon className="h-6 w-6 text-primary" />
          User Management & Moderation
        </h1>
        <p className="text-sm text-muted-foreground">
          View all registered accounts, enforce community suspensions, and review creator verification flags.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="flex gap-2 w-full sm:max-w-sm">
          <Input
            placeholder="Search name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 text-xs"
          />
          <Button type="submit" size="sm" variant="secondary" className="text-xs">
            <SearchIcon className="h-3.5 w-3.5 mr-1" />
            Search
          </Button>
        </form>

        <div className="flex gap-2 w-full sm:w-auto overflow-x-auto">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs"
          >
            <option value="all">All Roles</option>
            <option value="creator">Creators</option>
            <option value="brand">Brands</option>
            <option value="admin">Admins</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs"
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="suspended">Suspended Only</option>
          </select>
        </div>
      </div>

      {/* Users Table / List */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Loading users...
            </div>
          ) : users.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No users matching your criteria.
            </div>
          ) : (
            <div className="divide-y overflow-x-auto">
              {users.map((u) => {
                const isSuspended = u.status === "suspended";
                const isVerifiedCreator =
                  u.role === "creator" && u.creatorProfile?.verificationStatus === "verified";

                return (
                  <div
                    key={u._id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground">
                          {u.name}
                        </span>
                        <Badge variant="outline" className="text-[10px] capitalize">
                          {u.role}
                        </Badge>
                        {isVerifiedCreator && (
                          <Badge variant="default" className="text-[10px] bg-blue-600">
                            Verified
                          </Badge>
                        )}
                        {isSuspended ? (
                          <Badge variant="destructive" className="text-[10px]">
                            Suspended
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-[10px] text-green-700 bg-green-50">
                            Active
                          </Badge>
                        )}
                      </div>
                      <div className="text-muted-foreground">
                        {u.email} • Joined {new Date(u.createdAt).toLocaleDateString()}
                      </div>
                      {isSuspended && u.suspendedReason && (
                        <div className="text-destructive font-medium text-[11px] pt-1">
                          Suspension Reason: {u.suspendedReason}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {u.role !== "admin" && (
                        <>
                          {isSuspended ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs text-green-700 hover:text-green-800"
                              onClick={() => handleReactivate(u._id)}
                            >
                              <UserCheckIcon className="h-3.5 w-3.5 mr-1" />
                              Reactivate Account
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-xs text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                setUserToSuspend(u);
                                setSuspendReason("");
                                setErrorMsg("");
                              }}
                            >
                              <UserXIcon className="h-3.5 w-3.5 mr-1" />
                              Suspend Account
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
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

      {/* Suspend Confirmation Dialog */}
      <Dialog open={Boolean(userToSuspend)} onOpenChange={() => setUserToSuspend(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <ShieldAlertIcon className="h-5 w-5" />
              Suspend User Account
            </DialogTitle>
            <DialogDescription>
              Suspended users are immediately revoked of all login and API access.
            </DialogDescription>
          </DialogHeader>

          {userToSuspend && (
            <div className="space-y-4 py-2">
              {errorMsg && (
                <div className="p-2.5 text-xs bg-destructive/10 text-destructive rounded-md">
                  {errorMsg}
                </div>
              )}

              <div className="p-3 bg-muted/40 rounded-md text-xs space-y-1">
                <div><strong>User:</strong> {userToSuspend.name}</div>
                <div><strong>Email:</strong> {userToSuspend.email}</div>
                <div className="capitalize"><strong>Role:</strong> {userToSuspend.role}</div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sus-reason" className="text-xs font-semibold">
                  Mandatory suspension reason
                </Label>
                <Textarea
                  id="sus-reason"
                  placeholder="State violation details, terms breach, or fraud rationale..."
                  value={suspendReason}
                  onChange={(e) => setSuspendReason(e.target.value)}
                  rows={3}
                  className="text-xs resize-none"
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUserToSuspend(null)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleSuspendSubmit}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Suspending..." : "Confirm Suspension"}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
