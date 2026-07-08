"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles, TriangleAlert, CheckCircle2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { analyzeJobDescription } from "@/app/(dashboard)/jobs/actions";
import type { JobAnalysis } from "@/lib/ai/job-parser";

interface JobAiAnalyzerProps {
  /** Analiz başarılı olunca form alanlarını doldurması için üst bileşene iletilir. */
  onAnalyzed: (analysis: JobAnalysis, sourceText: string) => void;
}

/**
 * Formun tepesindeki akıllı analiz paneli: ham ilan metni yapıştırılır,
 * "Analyze with AI" ile parseJob çalışır, çıktı üst bileşene (JobForm)
 * setValue için teslim edilir. Ham metin react-hook-form'un DIŞINDA tutulur —
 * bu bir form alanı değil, analiz girdisidir.
 */
export function JobAiAnalyzer({ onAnalyzed }: JobAiAnalyzerProps) {
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [analyzedOnce, setAnalyzedOnce] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAnalyze() {
    setError(null);
    startTransition(async () => {
      const result = await analyzeJobDescription(rawText);
      if (result.ok) {
        onAnalyzed(result.analysis, rawText.trim());
        setAnalyzedOnce(true);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <section className="rounded-xl border bg-gradient-to-b from-primary/5 to-transparent p-4 sm:p-5">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="size-4 text-primary" />
        <h3 className="text-sm font-semibold">Smart fill with AI</h3>
        <span className="text-xs text-muted-foreground">— paste the posting, we extract the requirements</span>
      </div>

      <Textarea
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        disabled={isPending}
        placeholder="Paste the full job posting here…"
        className="min-h-32 resize-y bg-background"
      />

      <div className="mt-3 flex items-center gap-3">
        <Button
          type="button"
          disabled={isPending || rawText.trim().length === 0}
          onClick={handleAnalyze}
          className="group relative overflow-hidden rounded-full px-5 before:absolute before:inset-0 before:-translate-x-full before:bg-gradient-to-r before:from-transparent before:via-white/25 before:to-transparent before:transition-transform before:duration-700 hover:before:translate-x-full"
        >
          {isPending ? (
            <>
              <Loader2 data-icon="inline-start" className="animate-spin" />
              Analyzing…
            </>
          ) : (
            <>
              <Sparkles data-icon="inline-start" />
              Analyze with AI
            </>
          )}
        </Button>

        {analyzedOnce && !isPending && !error && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            Requirements extracted — review them below, then save.
          </span>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}
    </section>
  );
}
