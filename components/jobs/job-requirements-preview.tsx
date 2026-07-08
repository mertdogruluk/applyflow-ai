"use client";

import { ShieldAlert, ThumbsUp, CalendarClock, RefreshCw } from "lucide-react";

import { SkillBadgeGroup } from "@/components/profile/skill-badge-group";

interface JobRequirementsPreviewProps {
  mustHaves: string[];
  niceToHaves: string[];
  minYearsExperience: number | null | undefined;
  /** Analizden sonra description elle değiştirildiyse true — bayatlık uyarısı. */
  stale?: boolean;
}

/**
 * AI'ın çıkardığı gereksinimleri form altında gösterir:
 * zorunlular kırmızımsı (critical), artılar yeşilimsi (advantage).
 * Analiz yapılmadıysa hiç render edilmez.
 */
export function JobRequirementsPreview({
  mustHaves,
  niceToHaves,
  minYearsExperience,
  stale,
}: JobRequirementsPreviewProps) {
  if (mustHaves.length === 0 && niceToHaves.length === 0) return null;

  return (
    <section className="space-y-4 rounded-xl border bg-muted/30 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">AI-extracted requirements</h3>
        {typeof minYearsExperience === "number" && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="size-3.5" />
            {minYearsExperience === 0
              ? "Entry level"
              : `${minYearsExperience}+ years required`}
          </span>
        )}
      </div>

      {stale && (
        <p className="flex items-center gap-1.5 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
          <RefreshCw className="size-3.5 shrink-0" />
          The description changed since the last analysis — re-analyze to refresh these.
        </p>
      )}

      <SkillBadgeGroup
        title="Must-have requirements"
        icon={ShieldAlert}
        skills={mustHaves}
        tone="critical"
        emptyText="No mandatory skills detected."
      />

      <SkillBadgeGroup
        title="Nice to have"
        icon={ThumbsUp}
        skills={niceToHaves}
        tone="advantage"
        emptyText="No bonus skills detected."
      />
    </section>
  );
}
