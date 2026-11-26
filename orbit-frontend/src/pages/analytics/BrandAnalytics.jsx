import { useState, useEffect } from "react";
import api from "@/lib/api";
import {
  TrendingUpIcon,
  CreditCardIcon,
  MegaphoneIcon,
  HandshakeIcon,
  UsersIcon,
  FileCheckIcon,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function BrandAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get("/analytics/brand");
        setData(res.data);
      } catch (err) {
        console.error("Failed to load brand analytics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="container max-w-6xl py-8 px-4 text-center text-sm text-muted-foreground">
        Loading brand analytics...
      </div>
    );
  }

  const overview = data?.overview || {};
  const monthlySpending = data?.monthlySpending || [];
  const maxSpend = Math.max(...monthlySpending.map((m) => m.spent), 1);

  return (
    <div className="container max-w-6xl py-6 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <TrendingUpIcon className="h-6 w-6 text-primary" />
          Brand Campaign & Spend Analytics
        </h1>
        <p className="text-sm text-muted-foreground">
          Track campaign reach, creator deliverables, and collaboration expenditures.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spend
            </CardTitle>
            <CreditCardIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              ₹{Number(overview.totalSpent || 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Verified creator payouts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Campaigns
            </CardTitle>
            <MegaphoneIcon className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {overview.activeCampaigns || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.totalCampaigns || 0} total campaigns created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Applications Received
            </CardTitle>
            <FileCheckIcon className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {overview.totalApplicationsReceived || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Creator proposals submitted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Collaborations
            </CardTitle>
            <HandshakeIcon className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {overview.activeCollaborations || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {overview.completedCollaborations || 0} deliverables completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Spend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Monthly Campaign Spend (Last 6 Months)</CardTitle>
          <CardDescription>
            Historical payout volume to verified creators across all campaigns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {monthlySpending.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No payments recorded yet.
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-6 gap-2 items-end h-44 pb-2 border-b">
                {monthlySpending.map((item) => {
                  const heightPercent = Math.max(12, Math.round((item.spent / maxSpend) * 100));
                  return (
                    <div key={item.month} className="flex flex-col items-center gap-1.5 h-full justify-end">
                      <span className="text-[10px] text-muted-foreground font-semibold">
                        ₹{item.spent > 999 ? `${(item.spent / 1000).toFixed(1)}k` : item.spent}
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
    </div>
  );
}
