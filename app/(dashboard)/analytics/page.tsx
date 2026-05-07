import {
  Briefcase,
  TrendingUp,
  Trophy,
  XCircle,
  Send,
  CheckCircle2,
} from "lucide-react";

import { requireUserId } from "@/lib/auth";
import { getJobStats, getMonthlyApplications } from "@/lib/queries/analytics";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusDistribution } from "@/components/analytics/status-distribution";
import { MonthlyBarChart } from "@/components/analytics/monthly-bar-chart";

export const metadata = { title: "Analytics – ApplyFlow AI" };

export default async function AnalyticsPage() {
  const userId = await requireUserId();
  const [stats, monthly] = await Promise.all([
    getJobStats(userId),
    getMonthlyApplications(userId, 6),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Analytics</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Insights into your job search performance.
        </p>
      </div>

      {stats.total === 0 ? (
        <Card className="flex min-h-[280px] items-center justify-center p-8 text-center">
          <CardContent className="space-y-2 pt-0">
            <p className="text-base font-semibold">No data yet</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Add a few job applications and your analytics will populate here automatically.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Top stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Total Applications" value={stats.total} icon={Briefcase} description={`${stats.active} active`} />
            <StatCard title="Applied"     value={stats.byStatus.APPLIED} icon={Send} description={`${stats.responseRate}% response`} />
            <StatCard title="Interviews"  value={stats.interview} icon={TrendingUp} description={`${stats.interviewRate}% conversion`} />
            <StatCard title="Offers"      value={stats.offer} icon={Trophy} description="Accepted + Offer" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title="Saved"          value={stats.byStatus.WISHLIST}   icon={Briefcase} />
            <StatCard title="Technical Test" value={stats.byStatus.ASSESSMENT} icon={CheckCircle2} />
            <StatCard title="Rejected"       value={stats.rejected}            icon={XCircle} />
            <StatCard title="Withdrawn"      value={stats.byStatus.WITHDRAWN}  icon={XCircle} />
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Applications per month</CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlyBarChart data={monthly} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Status distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusDistribution byStatus={stats.byStatus} total={stats.total} />
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
