import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import {
  Briefcase,
  TrendingUp,
  Calendar,
  Trophy,
  ArrowRight,
} from "lucide-react";

import { requireUserId } from "@/lib/auth";
import {
  getJobStats,
  getRecentJobs,
  getUpcomingDeadlines,
} from "@/lib/queries/analytics";
import { formatDate, relativeTime } from "@/lib/format";
import { StatCard } from "@/components/dashboard/stat-card";
import { StatusBadge } from "@/components/jobs/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Dashboard – ApplyFlow AI" };

export default async function DashboardPage() {
  const userId = await requireUserId();
  const t = await getTranslations("dashboard");
  const locale = await getLocale();

  const [stats, recent, deadlines] = await Promise.all([
    getJobStats(userId),
    getRecentJobs(userId, 5),
    getUpcomingDeadlines(userId, 5),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">{t("welcome")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title={t("totalApplications")}
          value={stats.total}
          description={t("activeCount", { count: stats.active })}
          icon={Briefcase}
        />
        <StatCard
          title={t("interviews")}
          value={stats.interview}
          description={t("conversion", { rate: stats.interviewRate })}
          icon={TrendingUp}
        />
        <StatCard
          title={t("offers")}
          value={stats.offer}
          description={stats.offer > 0 ? t("niceWork") : t("keepGoing")}
          icon={Trophy}
        />
        <StatCard
          title={t("responseRate")}
          value={`${stats.responseRate}%`}
          description={t("ofApplied")}
          icon={Calendar}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">{t("recentJobs")}</CardTitle>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
              <Link href="/jobs">
                {t("viewAll")} <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recent.length === 0 ? (
              <EmptyRow message={t("noJobs")} />
            ) : (
              <ul className="divide-y divide-border">
                {recent.map((job) => (
                  <li key={job.id}>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="flex items-center justify-between gap-3 px-6 py-3 hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{job.title}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {job.company} · {relativeTime(job.updatedAt, locale)}
                        </p>
                      </div>
                      <StatusBadge status={job.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Upcoming deadlines */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("upcomingDeadlines")}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {deadlines.length === 0 ? (
              <EmptyRow message={t("noDeadlines")} />
            ) : (
              <ul className="divide-y divide-border">
                {deadlines.map((job) => (
                  <li key={job.id}>
                    <Link
                      href={`/jobs/${job.id}`}
                      className="flex items-center justify-between gap-3 px-6 py-3 hover:bg-muted/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{job.title}</p>
                        <p className="truncate text-xs text-muted-foreground">{job.company}</p>
                      </div>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(job.deadline, locale)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyRow({ message }: { message: string }) {
  return (
    <p className="px-6 py-6 text-sm text-muted-foreground">{message}</p>
  );
}
