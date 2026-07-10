import {
  Briefcase,
  TrendingUp,
  Trophy,
  XCircle,
  Send,
  CheckCircle2,
} from "lucide-react";
import { getTranslations } from "next-intl/server";

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
  const t = await getTranslations();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{t("analytics.title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("analytics.subtitle")}</p>
      </div>

      {stats.total === 0 ? (
        <Card className="flex min-h-70 items-center justify-center p-8 text-center">
          <CardContent className="space-y-2 pt-0">
            <p className="text-base font-semibold">{t("analytics.noData")}</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              {t("analytics.noDataDesc")}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Top stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title={t("dashboard.totalApplications")} value={stats.total} icon={Briefcase} description={t("dashboard.activeCount", { count: stats.active })} />
            <StatCard title={t("analytics.applied")}     value={stats.byStatus.APPLIED} icon={Send} description={t("analytics.responsePct", { rate: stats.responseRate })} />
            <StatCard title={t("dashboard.interviews")}  value={stats.interview} icon={TrendingUp} description={t("dashboard.conversion", { rate: stats.interviewRate })} />
            <StatCard title={t("dashboard.offers")}      value={stats.offer} icon={Trophy} description={t("analytics.offersDesc")} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard title={t("status.WISHLIST")}   value={stats.byStatus.WISHLIST}   icon={Briefcase} />
            <StatCard title={t("status.ASSESSMENT")} value={stats.byStatus.ASSESSMENT} icon={CheckCircle2} />
            <StatCard title={t("status.REJECTED")}   value={stats.rejected}            icon={XCircle} />
            <StatCard title={t("status.WITHDRAWN")}  value={stats.byStatus.WITHDRAWN}  icon={XCircle} />
          </div>

          {/* Charts */}
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("analytics.perMonth")}</CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlyBarChart data={monthly} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("analytics.statusDist")}</CardTitle>
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
