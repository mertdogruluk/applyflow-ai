"use client";

import { useState, useTransition } from "react";
import { Building2, Check, ExternalLink, Globe, Loader2, Plus, Quote } from "lucide-react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { MatchScoreRing } from "@/components/matches/match-score-ring";
import { saveDiscoveredJob } from "@/app/(dashboard)/matches/actions";
import type { DiscoveredMatch } from "@/lib/discovery/types";

type SaveState = "idle" | "saved" | "already";

/**
 * Dış kaynaktan keşfedilen ilanın kartı. MatchResultCard ile aynı görsel dil
 * (halka + alıntı + hover lift) ama iki aksiyonlu: kaynağa git (dış link) ve
 * "Save" — ilanı WISHLIST'e alır, arka planda parse+embed otomatik koşar.
 */
export function DiscoverJobCard({ match }: { match: DiscoveredMatch }) {
  const t = useTranslations("discover");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    setSaveError(null);
    startTransition(async () => {
      const result = await saveDiscoveredJob({
        title:       match.title,
        company:     match.company,
        url:         match.url,
        description: match.description,
        location:    match.location,
        salary:      match.salary,
        workType:    match.workType,
        source:      match.source,
      });
      if (result.ok) {
        setSaveState(result.alreadySaved ? "already" : "saved");
      } else {
        setSaveError(result.error);
      }
    });
  }

  return (
    <Card className="h-full gap-5 py-6 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-elevated">
      <CardHeader className="px-6">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 space-y-1.5">
            <h3 className="truncate text-sm leading-snug font-semibold tracking-tight text-foreground">{match.title}</h3>
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Building2 className="size-3.5 shrink-0" />
              <span className="truncate">{match.company}</span>
            </p>
            {match.location && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                <Globe className="size-3 shrink-0" />
                <span className="truncate">{match.location}</span>
              </p>
            )}
          </div>
          <MatchScoreRing score={match.fitScore} className="shrink-0" />
        </div>
      </CardHeader>

      <CardContent className="mt-auto space-y-2 px-6">
        <figure className="rounded-lg bg-muted/60 px-4 py-3">
          <Quote className="mb-1.5 size-3 text-muted-foreground/50" />
          <blockquote className="text-sm leading-relaxed text-muted-foreground italic">
            {match.reasoning}
          </blockquote>
        </figure>
        {saveError && (
          <p role="alert" className="text-xs text-destructive">
            {saveError}
          </p>
        )}
      </CardContent>

      <CardFooter className="justify-between gap-2 px-6">
        <Button asChild variant="ghost" size="sm">
          <a href={match.url} target="_blank" rel="noopener noreferrer">
            <ExternalLink data-icon="inline-start" />
            {t("viewPosting")}
          </a>
        </Button>

        {saveState === "idle" ? (
          <Button size="sm" onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <>
                <Loader2 data-icon="inline-start" className="animate-spin" />
                {t("savingBtn")}
              </>
            ) : (
              <>
                <Plus data-icon="inline-start" />
                {t("save")}
              </>
            )}
          </Button>
        ) : (
          <span className="flex items-center gap-1.5 text-xs font-medium text-success">
            <Check className="size-3.5" />
            {saveState === "already" ? t("alreadySaved") : t("savedWishlist")}
          </span>
        )}
      </CardFooter>
    </Card>
  );
}
