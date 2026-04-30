import {
  Briefcase,
  MapPin,
  Calendar,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { Job, ApplicationStatus, WorkType } from "@prisma/client";

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  WISHLIST:   { label: "Wishlist",   className: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400" },
  APPLIED:    { label: "Applied",    className: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  ASSESSMENT: { label: "Assessment", className: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  INTERVIEW:  { label: "Interview",  className: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
  OFFER:      { label: "Offer",      className: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  ACCEPTED:   { label: "Accepted",   className: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  REJECTED:   { label: "Rejected",   className: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300" },
  WITHDRAWN:  { label: "Withdrawn",  className: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500" },
};

const WORK_TYPE_LABEL: Record<WorkType, string> = {
  REMOTE:  "Remote",
  HYBRID:  "Hybrid",
  ON_SITE: "On-site",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(date: Date | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

// ─── Job Row ─────────────────────────────────────────────────────────────────

function JobRow({ job }: { job: Job }) {
  const status = STATUS_CONFIG[job.status];

  return (
    <Link
      href={`/jobs/${job.id}`}
      className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50"
    >
      {/* Company icon placeholder */}
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-background">
        <Briefcase className="h-4 w-4" />
      </div>

      {/* Main info */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">
            {job.title}
          </p>
          {job.jobUrl && (
            <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
          <span className="text-xs text-muted-foreground">{job.company}</span>
          {job.location && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-2.5 w-2.5" />
              {job.location}
            </span>
          )}
          <span className="text-xs text-muted-foreground">
            {WORK_TYPE_LABEL[job.workType]}
          </span>
        </div>
      </div>

      {/* Applied date — hidden on small screens */}
      <div className="hidden w-28 shrink-0 text-right sm:block">
        {job.appliedAt ? (
          <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatDate(job.appliedAt)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Not applied</span>
        )}
      </div>

      {/* Status badge */}
      <div className="shrink-0">
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${status.className}`}
        >
          {status.label}
        </span>
      </div>

      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
    </Link>
  );
}

// ─── Job List ─────────────────────────────────────────────────────────────────

interface JobListProps {
  jobs: Job[];
}

export function JobList({ jobs }: JobListProps) {
  return (
    <Card className="overflow-hidden p-0">
      {/* Table header */}
      <div className="hidden border-b border-border bg-muted/30 px-5 py-2.5 sm:grid sm:grid-cols-[1fr_auto_auto_auto] sm:gap-4">
        <span className="text-xs font-medium text-muted-foreground">Position / Company</span>
        <span className="w-28 text-right text-xs font-medium text-muted-foreground">Applied</span>
        <span className="text-xs font-medium text-muted-foreground">Status</span>
        <span className="w-4" />
      </div>

      {/* Rows */}
      <ul className="divide-y divide-border">
        {jobs.map((job) => (
          <li key={job.id}>
            <JobRow job={job} />
          </li>
        ))}
      </ul>

      {/* Footer count */}
      <div className="border-t border-border bg-muted/20 px-5 py-2.5">
        <p className="text-xs text-muted-foreground">
          {jobs.length} {jobs.length === 1 ? "application" : "applications"} total
        </p>
      </div>
    </Card>
  );
}
