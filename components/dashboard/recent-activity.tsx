import type { LucideIcon } from "lucide-react";
import {
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  status: "applied" | "reviewing" | "interview" | "rejected" | "draft";
}

const ACTIVITY_ITEMS: ActivityItem[] = [
  {
    id: "1",
    title: "Senior Frontend Engineer",
    subtitle: "Stripe Inc.",
    time: "2 hours ago",
    status: "applied",
  },
  {
    id: "2",
    title: "Product Designer",
    subtitle: "Linear",
    time: "Yesterday",
    status: "reviewing",
  },
  {
    id: "3",
    title: "Full-Stack Developer",
    subtitle: "Vercel",
    time: "2 days ago",
    status: "interview",
  },
  {
    id: "4",
    title: "Software Engineer II",
    subtitle: "Notion",
    time: "3 days ago",
    status: "rejected",
  },
  {
    id: "5",
    title: "UX Engineer",
    subtitle: "Figma",
    time: "5 days ago",
    status: "draft",
  },
];

const STATUS_CONFIG: Record<
  ActivityItem["status"],
  { label: string; icon: LucideIcon; variant: string }
> = {
  applied: {
    label: "Applied",
    icon: Send,
    variant: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  reviewing: {
    label: "Reviewing",
    icon: Clock,
    variant: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  interview: {
    label: "Interview",
    icon: CheckCircle2,
    variant: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  rejected: {
    label: "Rejected",
    icon: AlertCircle,
    variant: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  },
  draft: {
    label: "Draft",
    icon: FileText,
    variant: "bg-muted text-muted-foreground",
  },
};

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y divide-border">
          {ACTIVITY_ITEMS.map((item) => {
            const { label, icon: StatusIcon, variant } = STATUS_CONFIG[item.status];
            return (
              <li
                key={item.id}
                className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/40"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.subtitle}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      variant
                    )}
                  >
                    <StatusIcon className="h-3 w-3" />
                    {label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {item.time}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
