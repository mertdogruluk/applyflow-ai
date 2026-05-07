import {
  Briefcase,
  MapPin,
  Calendar,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { StatusSelect } from "@/components/jobs/status-select";
import { formatDate } from "@/lib/format";
import type { Job, WorkType } from "@prisma/client";

const WORK_TYPE_LABEL: Record<WorkType, string> = {
  REMOTE:  "Remote",
  HYBRID:  "Hybrid",
  ON_SITE: "On-site",
};

// ─── Job Row ─────────────────────────────────────────────────────────────────

function JobRow({ job }: { job: Job }) {
  return (
    <div className="group relative flex items-center gap-4 px-5 py-4 transition-colors hover:bg-muted/50">
      {/* Whole-row link sits behind interactive controls */}
      <Link
        href={`/jobs/${job.id}`}
        aria-label={`Open ${job.title} at ${job.company}`}
        className="absolute inset-0 z-0"
      />

      {/* Company icon */}
      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-background">
        <Briefcase className="h-4 w-4" />
      </div>

      {/* Main info */}
      <div className="relative z-10 min-w-0 flex-1 pointer-events-none">
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

      {/* Applied date */}
      <div className="relative z-10 hidden w-28 shrink-0 text-right sm:block pointer-events-none">
        {job.appliedAt ? (
          <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatDate(job.appliedAt)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Not applied</span>
        )}
      </div>

      {/* Status (interactive) */}
      <div className="relative z-20 shrink-0">
        <StatusSelect jobId={job.id} status={job.status} />
      </div>

      <ChevronRight className="relative z-10 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" />
    </div>
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
