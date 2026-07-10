import {
  Briefcase,
  MapPin,
  Calendar,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Card } from "@/components/ui/card";
import { StatusSelect } from "@/components/jobs/status-select";
import { formatDate } from "@/lib/format";
import type { Job } from "@prisma/client";

// ─── Job Row ─────────────────────────────────────────────────────────────────

function JobRow({ job }: { job: Job }) {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div className="group relative flex items-center gap-4 px-6 py-5 transition-colors duration-300 ease-out hover:bg-muted/40">
      {/* Whole-row link sits behind interactive controls */}
      <Link
        href={`/jobs/${job.id}`}
        aria-label={t("jobs.openAria", { title: job.title, company: job.company })}
        className="absolute inset-0 z-0"
      />

      {/* Company icon */}
      <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-muted-foreground transition-colors duration-300 ease-out group-hover:bg-background">
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
            {t(`workType.${job.workType}`)}
          </span>
        </div>
      </div>

      {/* Applied date */}
      <div className="relative z-10 hidden w-28 shrink-0 text-right sm:block pointer-events-none">
        {job.appliedAt ? (
          <span className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatDate(job.appliedAt, locale)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">{t("jobs.notApplied")}</span>
        )}
      </div>

      {/* Status (interactive) */}
      <div className="relative z-20 shrink-0">
        <StatusSelect jobId={job.id} status={job.status} />
      </div>

      <ChevronRight className="relative z-10 h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 pointer-events-none" />
    </div>
  );
}

// ─── Job List ─────────────────────────────────────────────────────────────────

interface JobListProps {
  jobs: Job[];
}

export function JobList({ jobs }: JobListProps) {
  const t = useTranslations("jobs");

  return (
    <Card className="gap-0 overflow-hidden p-0">
      {/* Table header */}
      <div className="hidden border-b border-border bg-muted/30 px-6 py-3 sm:grid sm:grid-cols-[1fr_auto_auto_auto] sm:gap-4">
        <span className="text-xs font-medium text-muted-foreground">{t("listHeaderPosition")}</span>
        <span className="w-28 text-right text-xs font-medium text-muted-foreground">{t("listHeaderApplied")}</span>
        <span className="text-xs font-medium text-muted-foreground">{t("listHeaderStatus")}</span>
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
      <div className="border-t border-border bg-muted/20 px-6 py-3">
        <p className="text-xs text-muted-foreground">
          {t("totalCount", { count: jobs.length })}
        </p>
      </div>
    </Card>
  );
}
