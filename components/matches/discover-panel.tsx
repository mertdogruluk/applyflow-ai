"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  Compass,
  Loader2,
  RefreshCw,
  TriangleAlert,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DiscoverJobCard } from "@/components/matches/discover-job-card";
import { MatchGridSkeleton } from "@/components/matches/match-grid-skeleton";
import { discoverJobs } from "@/app/(dashboard)/matches/actions";
import type { DiscoveredMatch } from "@/lib/discovery/types";

interface DiscoverPanelProps {
  hasProfile: boolean;
}

type ViewState =
  | { kind: "idle" }
  | { kind: "results"; matches: DiscoveredMatch[]; skipped: number; poolSize: number }
  | { kind: "no-profile" }
  | { kind: "error"; message: string };

/**
 * Keşif sekmesinin durum makinesi — MatchDashboard ile aynı desen.
 * Gerçek ilanlar dış API'den gelir; LLM yalnızca puanlar (halüsinasyon yok).
 */
export function DiscoverPanel({ hasProfile }: DiscoverPanelProps) {
  const [view, setView] = useState<ViewState>(
    hasProfile ? { kind: "idle" } : { kind: "no-profile" },
  );
  const [isPending, startTransition] = useTransition();

  function run() {
    startTransition(async () => {
      const result = await discoverJobs();
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
            <p className="text-sm font-medium">Set up your career profile first</p>
            <p className="text-sm text-muted-foreground">
              Discovery searches real remote job postings and scores them
              against your CV profile.
            </p>
          </div>
          <Button asChild>
            <Link href="/profile">
              <UserRound data-icon="inline-start" />
              Go to Career Profile
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button
          onClick={run}
          disabled={isPending}
          className="group relative overflow-hidden rounded-full px-5 before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent before:transition-transform before:duration-700 hover:before:translate-x-full"
        >
          {isPending ? (
            <>
              <Loader2 data-icon="inline-start" className="animate-spin" />
              Discovering…
            </>
          ) : view.kind === "results" ? (
            <>
              <RefreshCw data-icon="inline-start" />
              Discover again
            </>
          ) : (
            <>
              <Compass data-icon="inline-start" />
              Discover jobs for me
            </>
          )}
        </Button>
        {view.kind === "results" && !isPending && (
          <span className="text-sm text-muted-foreground">
            {view.matches.length} of {view.poolSize} live postings matched
            {view.skipped > 0 && ` · ${view.skipped} skipped`}
          </span>
        )}
      </div>

      {isPending ? (
        <MatchGridSkeleton message="Fetching live remote postings and scoring them against your profile…" />
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
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                <Compass className="size-6 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">No matching postings right now</p>
                <p className="text-sm text-muted-foreground">
                  {view.poolSize} live postings were checked but none overlapped
                  with your profile — try again later, new jobs are posted daily.
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
        <p className="text-sm text-muted-foreground">
          Real postings are fetched from Remotive and scored by the AI judge —
          nothing is invented, and saving one adds it straight to your wishlist.
        </p>
      )}
    </div>
  );
}
