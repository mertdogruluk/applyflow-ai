"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Briefcase,
  Loader2,
  RefreshCw,
  Sparkles,
  TriangleAlert,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MatchResultCard } from "@/components/matches/match-result-card";
import { MatchGridSkeleton } from "@/components/matches/match-grid-skeleton";
import { findMatches } from "@/app/(dashboard)/matches/actions";
import type { JobMatch } from "@/lib/ai/match-engine";

interface MatchDashboardProps {
  /** RSC'den gelir — profil hiç yoksa buton yerine doğrudan CTA gösterilir. */
  hasProfile: boolean;
}

type ViewState =
  | { kind: "idle" }
  | { kind: "results"; matches: JobMatch[]; skipped: number }
  | { kind: "no-profile" }
  | { kind: "error"; message: string };

/**
 * Match Dashboard durum makinesi. Eşleştirme pahalı bir LLM işi (~10 sn)
 * olduğu için sayfa yüklenirken ASLA otomatik çalışmaz — kullanıcı tetikler,
 * skeleton grid gösterilir, sonuçlar karta akar.
 */
export function MatchDashboard({ hasProfile }: MatchDashboardProps) {
  const t = useTranslations("matches");
  const [view, setView] = useState<ViewState>(
    hasProfile ? { kind: "idle" } : { kind: "no-profile" },
  );
  const [isPending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const result = await findMatches();
      if (result.ok) {
        setView({ kind: "results", matches: result.matches, skipped: result.skipped });
      } else if (result.code === "NO_PROFILE") {
        setView({ kind: "no-profile" });
      } else {
        setView({ kind: "error", message: result.error });
      }
    });
  }

  // ── Profil yok: düz hata değil, yol gösteren CTA ──────────────────────────
  if (view.kind === "no-profile") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <UserRound className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">{t("noProfileTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("noProfileDesc")}</p>
          </div>
          <Button asChild>
            <Link href="/profile">
              <UserRound data-icon="inline-start" />
              {t("goToProfile")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Tetikleyici ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Button
          onClick={run}
          disabled={isPending}
          className="rounded-full px-5 transition-all duration-300 ease-out hover:bg-primary/90"
        >
          {isPending ? (
            <>
              <Loader2 data-icon="inline-start" className="animate-spin" />
              {t("matching")}
            </>
          ) : view.kind === "results" ? (
            <>
              <RefreshCw data-icon="inline-start" />
              {t("rerunCta")}
            </>
          ) : (
            <>
              <Sparkles data-icon="inline-start" />
              {t("findCta")}
            </>
          )}
        </Button>
        {view.kind === "results" && !isPending && (
          <span className="text-sm text-muted-foreground">
            {t("scored", { count: view.matches.length })}
            {view.skipped > 0 && ` · ${t("skipped", { count: view.skipped })}`}
          </span>
        )}
      </div>

      {/* ── Gövde ────────────────────────────────────────────────────────── */}
      {isPending ? (
        <MatchGridSkeleton />
      ) : view.kind === "error" ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          {view.message}
        </div>
      ) : view.kind === "results" ? (
        view.matches.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Briefcase className="size-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{t("emptyTitle")}</p>
                <p className="text-sm text-muted-foreground">{t("emptyDesc")}</p>
              </div>
              <Button asChild variant="outline">
                <Link href="/jobs/new">
                  <Briefcase data-icon="inline-start" />
                  {t("addJob")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {view.matches.map((match) => (
              <MatchResultCard key={match.jobId} match={match} />
            ))}
          </div>
        )
      ) : null}
    </div>
  );
}
