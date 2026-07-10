"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Compass,
  Loader2,
  MapPin,
  RefreshCw,
  TriangleAlert,
  UserRound,
} from "lucide-react";
import type { WorkType } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DiscoverJobCard } from "@/components/matches/discover-job-card";
import { MatchGridSkeleton } from "@/components/matches/match-grid-skeleton";
import { discoverJobs } from "@/app/(dashboard)/matches/actions";
import type { DiscoveredMatch, DiscoverySource } from "@/lib/discovery/types";

interface DiscoverPanelProps {
  hasProfile: boolean;
}

type ViewState =
  | { kind: "idle" }
  | { kind: "results"; matches: DiscoveredMatch[]; skipped: number; poolSize: number }
  | { kind: "no-profile" }
  | { kind: "error"; message: string };

type WorkTypeFilter = WorkType | "ANY";

/**
 * Keşif sekmesinin durum makinesi — MatchDashboard ile aynı desen.
 * Gerçek ilanlar dış API'den gelir; LLM yalnızca puanlar (halüsinasyon yok).
 * Filtreler: kaynak (global remote / Türkiye), çalışma tipi, konum + arama.
 */
export function DiscoverPanel({ hasProfile }: DiscoverPanelProps) {
  const t = useTranslations();
  const [view, setView] = useState<ViewState>(
    hasProfile ? { kind: "idle" } : { kind: "no-profile" },
  );
  const [source, setSource] = useState<DiscoverySource>("remotive");
  const [workType, setWorkType] = useState<WorkTypeFilter>("ANY");
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [isPending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const result = await discoverJobs({
        source,
        workType,
        query:    query.trim() || undefined,
        location: location.trim() || undefined,
      });
      if (result.ok) {
        setView({
          kind:     "results",
          matches:  result.matches,
          skipped:  result.skipped,
          poolSize: result.poolSize,
        });
      } else if (result.code === "NO_PROFILE") {
        setView({ kind: "no-profile" });
      } else {
        setView({ kind: "error", message: result.error });
      }
    });
  }

  if (view.kind === "no-profile") {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <div className="flex size-12 items-center justify-center rounded-full bg-muted">
            <UserRound className="size-6 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">{t("matches.noProfileTitle")}</p>
            <p className="text-sm text-muted-foreground">{t("discover.noProfileDesc")}</p>
          </div>
          <Button asChild>
            <Link href="/profile">
              <UserRound data-icon="inline-start" />
              {t("matches.goToProfile")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Filtre barı ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-muted/40 p-4">
        <Select
          value={source}
          onValueChange={(v) => setSource(v as DiscoverySource)}
          disabled={isPending}
        >
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="remotive">{t("discover.srcRemote")}</SelectItem>
            <SelectItem value="jsearch">{t("discover.srcTurkey")}</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={workType}
          onValueChange={(v) => setWorkType(v as WorkTypeFilter)}
          disabled={isPending}
        >
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ANY">{t("workType.ANY")}</SelectItem>
            <SelectItem value="REMOTE">{t("workType.REMOTE")}</SelectItem>
            <SelectItem value="HYBRID">{t("workType.HYBRID")}</SelectItem>
            <SelectItem value="ON_SITE">{t("workType.ON_SITE")}</SelectItem>
          </SelectContent>
        </Select>

        {source === "jsearch" && (
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              disabled={isPending}
              placeholder={t("discover.cityPlaceholder")}
              className="w-44 pl-8"
            />
          </div>
        )}

        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isPending}
          placeholder={t("discover.keywordsPlaceholder")}
          className="min-w-52 flex-1"
        />

        <Button
          onClick={run}
          disabled={isPending}
          className="rounded-full px-5 transition-all duration-300 ease-out hover:bg-primary/90"
        >
          {isPending ? (
            <>
              <Loader2 data-icon="inline-start" className="animate-spin" />
              {t("discover.discovering")}
            </>
          ) : view.kind === "results" ? (
            <>
              <RefreshCw data-icon="inline-start" />
              {t("discover.again")}
            </>
          ) : (
            <>
              <Compass data-icon="inline-start" />
              {t("discover.cta")}
            </>
          )}
        </Button>
      </div>

      {view.kind === "results" && !isPending && (
        <p className="text-sm text-muted-foreground">
          {t("discover.matchedOf", { matched: view.matches.length, pool: view.poolSize })}
          {view.skipped > 0 && ` · ${t("matches.skipped", { count: view.skipped })}`}
        </p>
      )}

      {isPending ? (
        <MatchGridSkeleton message={t("discover.loadingMsg")} />
      ) : view.kind === "error" ? (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          {view.message}
        </div>
      ) : view.kind === "results" ? (
        view.matches.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Compass className="size-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">{t("discover.emptyTitle")}</p>
                <p className="text-sm text-muted-foreground">
                  {t("discover.emptyDesc", { pool: view.poolSize })}
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {view.matches.map((match) => (
              <DiscoverJobCard key={match.externalId} match={match} />
            ))}
          </div>
        )
      ) : (
        <p className="text-sm text-muted-foreground">{t("discover.idleHint")}</p>
      )}
    </div>
  );
}
