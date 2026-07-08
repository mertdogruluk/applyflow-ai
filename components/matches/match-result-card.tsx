import Link from "next/link";
import { Building2, Quote } from "lucide-react";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MatchScoreRing } from "@/components/matches/match-score-ring";
import type { JobMatch } from "@/lib/ai/match-engine";

/**
 * Tek eşleşme kartı. Tamamı ilan detayına link; hover'da hafif yukarı
 * kalkar ve gölgesi artar (premium mikro-etkileşim).
 * Hakem yorumu bg-muted içinde italic alıntı olarak en altta.
 */
export function MatchResultCard({ match }: { match: JobMatch }) {
  return (
    <Link href={`/jobs/${match.jobId}`} className="block outline-none focus-visible:ring-3 focus-visible:ring-ring/50 rounded-xl">
      <Card className="h-full transition-all hover:-translate-y-1 hover:shadow-lg">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <h3 className="truncate text-sm leading-snug font-semibold">
                {match.title}
              </h3>
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Building2 className="size-3.5 shrink-0" />
                <span className="truncate">{match.company}</span>
              </p>
              <p className="text-xs text-muted-foreground/70">
                Semantic similarity {(match.similarity * 100).toFixed(0)}%
              </p>
            </div>
            <MatchScoreRing score={match.fitScore} className="shrink-0" />
          </div>
        </CardHeader>

        <CardContent className="mt-auto">
          <figure className="rounded-lg bg-muted px-3 py-2.5">
            <Quote className="mb-1 size-3 text-muted-foreground/60" />
            <blockquote className="text-sm text-muted-foreground italic">
              {match.reasoning}
            </blockquote>
          </figure>
        </CardContent>
      </Card>
    </Link>
  );
}
