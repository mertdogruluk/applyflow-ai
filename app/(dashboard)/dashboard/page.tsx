import { StatCard } from "@/components/dashboard/stat-card";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  TrendingUp,
} from "lucide-react";

export const metadata = {
  title: "Dashboard – ApplyFlow AI",
};

const STATS = [
  {
    title: "Total Applications",
    value: "47",
    delta: 12,
    icon: Briefcase,
  },
  {
    title: "Active Jobs",
    value: "8",
    delta: 3,
    icon: TrendingUp,
  },
  {
    title: "Interviews Scheduled",
    value: "3",
    delta: 0,
    icon: Clock,
  },
  {
    title: "Offers Received",
    value: "1",
    delta: 100,
    icon: CheckCircle2,
  },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h2 className="text-xl font-semibold tracking-tight">
          Good morning 👋
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Here&apos;s an overview of your job search activity.
        </p>
      </div>

      {/* Stat cards grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STATS.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Recent activity */}
      <RecentActivity />
    </div>
  );
}
