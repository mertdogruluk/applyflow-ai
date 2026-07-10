"use client";

import { useState, useTransition } from "react";
import { Loader2, Sparkles, TriangleAlert, CheckCircle2 } from "lucide-react";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("analyzer");
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
    <section className="rounded-xl border border-border bg-muted/40 p-6 sm:p-8">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="size-4 text-primary/80" />
        <h3 className="text-sm font-semibold tracking-tight text-foreground">{t("title")}</h3>
        <span className="text-xs text-muted-foreground">{t("hint")}</span>
      </div>

      <Textarea
        value={rawText}
        onChange={(e) => setRawText(e.target.value)}
        disabled={isPending}
        placeholder={t("placeholder")}
        className="min-h-32 resize-y bg-background"
      />

      <div className="mt-4 flex items-center gap-3">
        <Button
          type="button"
          disabled={isPending || rawText.trim().length === 0}
          onClick={handleAnalyze}
          className="rounded-full px-5 transition-all duration-300 ease-out hover:bg-primary/90"
        >
          {isPending ? (
            <>
              <Loader2 data-icon="inline-start" className="animate-spin" />
              {t("analyzing")}
            </>
          ) : (
            <>
              <Sparkles data-icon="inline-start" />
              {t("analyzeCta")}
            </>
          )}
        </Button>

        {analyzedOnce && !isPending && !error && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CheckCircle2 className="size-3.5 text-success" />
            {t("success")}
          </span>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="mt-4 flex items-start gap-2 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <TriangleAlert className="mt-0.5 size-4 shrink-0" />
          {error}
        </div>
      )}
    </section>
  );
}
