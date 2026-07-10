"use client";

import { ShieldAlert, ThumbsUp, CalendarClock, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("analyzer");

  if (mustHaves.length === 0 && niceToHaves.length === 0) return null;

  return (
    <section className="space-y-5 rounded-xl border border-border bg-muted/40 p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold tracking-tight text-foreground">{t("reqTitle")}</h3>
        {typeof minYearsExperience === "number" && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarClock className="size-3.5" />
            {minYearsExperience === 0
              ? t("entryLevel")
              : t("yearsRequired", { years: minYearsExperience })}
          </span>
        )}
      </div>

      {stale && (
        <p className="flex items-center gap-1.5 rounded-lg bg-warning/10 px-4 py-2.5 text-xs text-warning">
          <RefreshCw className="size-3.5 shrink-0" />
          {t("stale")}
        </p>
      )}

      <SkillBadgeGroup
        title={t("mustHave")}
        icon={ShieldAlert}
        skills={mustHaves}
        tone="critical"
        emptyText={t("noMust")}
      />

      <SkillBadgeGroup
        title={t("niceToHave")}
        icon={ThumbsUp}
        skills={niceToHaves}
        tone="advantage"
        emptyText={t("noNice")}
      />
    </section>
  );
}
