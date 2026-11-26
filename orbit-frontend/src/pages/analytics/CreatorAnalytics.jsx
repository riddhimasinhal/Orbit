import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  TrendingUpIcon,
  DollarSignIcon,
  FileTextIcon,
  HandshakeIcon,
  UsersIcon,
  ClockIcon,
  ShieldCheckIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function CreatorAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get("/analytics/creator");
        setData(res.data);
      } catch (err) {
        console.error("Failed to load creator analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="container max-w-6xl py-8 px-4 text-center text-sm text-muted-foreground">
        Loading creator analytics...
      </div>
    );
  }

  const overview = data?.overview || {};
  const monthlyEarnings = data?.monthlyEarnings || [];
  const maxEarnings = Math.max(...monthlyEarnings.map((m) => m.earnings), 1);

  return (
    <div className="container max-w-6xl py-6 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <TrendingUpIcon className="h-6 w-6 text-primary" />
            Creator Performance & Analytics
          </h1>
          <p className="text-sm text-muted-foreground">
            Monitor your earnings, proposal conversion, collaborations, and network growth.
          </p>
        </div>

        <Badge
          variant={overview.verificationStatus === "verified" ? "default" : "outline"}
          className="self-start sm:self-auto capitalize"
        >
          <ShieldCheckIcon className="h-3.5 w-3.5 mr-1" />
          {overview.verificationStatus === "verified" ? "Verified Creator" : "Unverified Profile"}
        </Badge>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Earnings
            </CardTitle>
            <DollarSignIcon className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ₹{Number(overview.totalEarnings || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Verified paid transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Payouts
            </CardTitle>
            <ClockIcon className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ₹{Number(overview.pendingEarnings || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Awaiting completion or processing
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Collaborations
            </CardTitle>
            <HandshakeIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {overview.activeCollaborations || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.completedCollaborations || 0} completed successfully
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Network Connections
            </CardTitle>
            <UsersIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {overview.connectionsCount || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Active brand relationships
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Visual Monthly Performance & Application Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Monthly Earnings (Last 6 Months)</CardTitle>
            <CardDescription>
              Verified milestone payments received through Orbit escrow and contracts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyEarnings.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No earnings recorded yet.
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                <div className="grid grid-cols-6 gap-2 items-end h-44 pb-2 border-b">
                  {monthlyEarnings.map((item) => {
                    const heightPercent = Math.max(12, Math.round((item.earnings / maxEarnings) * 100));
                    return (
                      <div key={item.month} className="flex flex-col items-center gap-1.5 h-full justify-end">
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          ₹{item.earnings > 999 ? `${(item.earnings / 1000).toFixed(1)}k` : item.earnings}
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
            <CardTitle className="text-base">Application Pipeline</CardTitle>
            <CardDescription>
              Performance of your campaign proposals.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Submitted</span>
                <span className="font-semibold">{overview.totalApplications || 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-emerald-600 font-medium">Accepted</span>
                <span className="font-semibold text-emerald-600">{overview.acceptedApplications || 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-amber-500 font-medium">Pending Review</span>
                <span className="font-semibold text-amber-500">{overview.pendingApplications || 0}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Not Selected</span>
                <span className="font-semibold text-muted-foreground">{overview.rejectedApplications || 0}</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="text-xs text-muted-foreground">Proposal Acceptance Rate</div>
              <div className="text-2xl font-bold mt-1 text-primary">
                {overview.totalApplications > 0
                  ? Math.round(((overview.acceptedApplications || 0) / overview.totalApplications) * 100)
                  : 0}
                %
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
