import Link from "next/link";
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

  const [stats, recent, deadlines] = await Promise.all([
    getJobStats(userId),
    getRecentJobs(userId, 5),
    getUpcomingDeadlines(userId, 5),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold tracking-tight">Welcome back 👋</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s an overview of your job search activity.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Applications"
          value={stats.total}
          description={`${stats.active} active`}
          icon={Briefcase}
        />
        <StatCard
          title="Interviews"
          value={stats.interview}
          description={`${stats.interviewRate}% conversion`}
          icon={TrendingUp}
        />
        <StatCard
          title="Offers"
          value={stats.offer}
          description={stats.offer > 0 ? "Nice work!" : "Keep going"}
          icon={Trophy}
        />
        <StatCard
          title="Response Rate"
          value={`${stats.responseRate}%`}
          description="Of applied jobs"
          icon={Calendar}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Recent Jobs</CardTitle>
            <Button asChild variant="ghost" size="sm" className="gap-1 text-xs">
              <Link href="/jobs">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {recent.length === 0 ? (
              <EmptyRow message="No jobs yet — add your first application." />
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
                          {job.company} · {relativeTime(job.updatedAt)}
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
            <CardTitle className="text-base">Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {deadlines.length === 0 ? (
              <EmptyRow message="No upcoming deadlines. Set a reminder when adding a job." />
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
                        {formatDate(job.deadline)}
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
