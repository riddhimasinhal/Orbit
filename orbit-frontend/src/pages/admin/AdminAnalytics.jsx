import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  TrendingUpIcon,
  UsersIcon,
  ShieldAlertIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  MegaphoneIcon,
  HandshakeIcon,
  FileWarningIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get("/analytics/admin");
        setData(res.data);
      } catch (err) {
        console.error("Failed to load admin analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="container max-w-6xl py-8 px-4 text-center text-sm text-muted-foreground">
        Loading admin platform analytics...
      </div>
    );
  }

  const overview = data?.overview || {};
  const monthlyVolume = data?.monthlyVolume || [];
  const maxVol = Math.max(...monthlyVolume.map((m) => m.volume), 1);

  return (
    <div className="container max-w-6xl py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <TrendingUpIcon className="h-6 w-6 text-primary" />
          Orbit Platform Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Real-time platform metrics, user adoption, transaction volume, and moderation health.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Users
            </CardTitle>
            <UsersIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {overview.totalUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.creatorCount || 0} creators • {overview.brandCount || 0} brands
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Platform GMV
            </CardTitle>
            <CreditCardIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ₹{Number(overview.totalPlatformVolume || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Verified transaction volume
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Verification Queue
            </CardTitle>
            <ShieldCheckIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {overview.pendingVerifications || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.verifiedCreators || 0} creators verified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Safety & Reports
            </CardTitle>
            <FileWarningIcon className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {overview.pendingReports || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.suspendedCount || 0} suspended users
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Transaction Volume Chart & Marketplace Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Gross Transaction Volume (Last 6 Months)</CardTitle>
            <CardDescription>
              Total contract settlements processed across the Orbit marketplace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyVolume.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No transaction data available yet.
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-6 gap-2 items-end h-44 pb-2 border-b">
                  {monthlyVolume.map((item) => {
                    const heightPercent = Math.max(12, Math.round((item.volume / maxVol) * 100));
                    return (
                      <div key={item.month} className="flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          ₹{item.volume > 999 ? `${(item.volume / 1000).toFixed(1)}k` : item.volume}
                        </span>
                        <div
                          style={{ height: `${heightPercent}%` }}
                          className="w-full max-w-[42px] bg-primary rounded-t-sm transition-all hover:bg-primary/80"
                        />
                        <span className="text-[11px] text-muted-foreground truncate w-full text-center">
                          {item.month.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Marketplace Health</CardTitle>
            <CardDescription>Live distribution of campaigns and collaborations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Published Campaigns</span>
                <span className="font-semibold">{overview.publishedCampaigns || 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Campaigns</span>
                <span className="font-semibold">{overview.totalCampaigns || 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Active Collaborations</span>
                <span className="font-semibold">{overview.totalCollaborations || 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Completed Collaborations</span>
                <span className="font-semibold">{overview.completedCollaborations || 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Resolved Moderation Reports</span>
                <span className="font-semibold text-green-600">{overview.resolvedReports || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
