import Link from "next/link";
import { Building2, Quote } from "lucide-react";
import { useTranslations } from "next-intl";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MatchScoreRing } from "@/components/matches/match-score-ring";
import type { JobMatch } from "@/lib/ai/match-engine";

/**
 * Tek eşleşme kartı. Tamamı ilan detayına link; hover'da hafif yukarı
 * kalkar ve gölgesi artar (premium mikro-etkileşim).
 * Hakem yorumu bg-muted içinde italic alıntı olarak en altta.
 */
export function MatchResultCard({ match }: { match: JobMatch }) {
  const t = useTranslations("matches");
  return (
    <Link href={`/jobs/${match.jobId}`} className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
      <Card className="h-full gap-5 py-6 transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-elevated">
        <CardHeader className="px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1.5">
              <h3 className="truncate text-sm leading-snug font-semibold tracking-tight text-foreground">
                {match.title}
              </h3>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Building2 className="size-3.5 shrink-0" />
                <span className="truncate">{match.company}</span>
              </p>
              <p className="text-xs text-muted-foreground/70">
                {t("similarity", { pct: (match.similarity * 100).toFixed(0) })}
              </p>
            </div>
            <MatchScoreRing score={match.fitScore} className="shrink-0" />
          </div>
        </CardHeader>

        <CardContent className="mt-auto px-6">
          <figure className="rounded-lg bg-muted/60 px-4 py-3">
            <Quote className="mb-1.5 size-3 text-muted-foreground/50" />
            <blockquote className="text-sm leading-relaxed text-muted-foreground italic">
              {match.reasoning}
            </blockquote>
          </figure>
        </CardContent>
      </Card>
    </Link>
  );
}
