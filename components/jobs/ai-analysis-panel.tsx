"use client";

import { useState } from "react";
import {
  Sparkles,
  Loader2,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { AiAnalysis } from "@prisma/client";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateAnalysis } from "@/app/(dashboard)/jobs/[id]/actions";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";

interface AiAnalysisPanelProps {
  jobId: string;
  analysis: AiAnalysis | null;
}

export function AiAnalysisPanel({ jobId, analysis }: AiAnalysisPanelProps) {
  const t = useTranslations("aiPanel");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setPending(true);
    setError(null);
    try {
      await generateAnalysis(jobId);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("analysisFailed"));
    } finally {
      setPending(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <Sparkles className="h-4 w-4 text-primary" />
          {t("title")}
        </CardTitle>
        <Button
          size="sm"
          onClick={handleGenerate}
          disabled={pending}
          className="gap-1.5"
        >
          {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {analysis ? t("regenerate") : t("generate")}
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!analysis && !error && (
          <p className="text-sm text-muted-foreground">{t("intro")}</p>
        )}

        {analysis && <AnalysisResult analysis={analysis} />}
      </CardContent>
    </Card>
  );
}

// ─── Result rendering ────────────────────────────────────────────────────────

function AnalysisResult({ analysis }: { analysis: AiAnalysis }) {
  const t = useTranslations("aiPanel");
  const locale = useLocale();

  return (
    <div className="space-y-5">
      {/* Score + summary */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <ScoreCircle score={analysis.matchScore ?? null} />
        <div className="min-w-0 flex-1">
          {analysis.summary && (
            <p className="text-sm leading-6 text-foreground/90">
              {analysis.summary}
            </p>
          )}
          <p className="mt-2 text-[11px] text-muted-foreground">
            {t("generated", { date: formatDateTime(analysis.updatedAt, locale) })}
          </p>
        </div>
      </div>

      {/* Strengths / weaknesses */}
      <div className="grid gap-4 sm:grid-cols-2">
        <BulletList
          title={t("strengths")}
          icon={<CheckCircle2 className="h-3.5 w-3.5 text-success" />}
          items={analysis.strengths}
          empty={t("noStrengths")}
        />
        <BulletList
          title={t("missingKeywords")}
          icon={<XCircle className="h-3.5 w-3.5 text-destructive" />}
          items={analysis.weaknesses}
          empty={t("noGaps")}
        />
      </div>

      {/* CV bullets */}
      {analysis.suggestions.length > 0 && (
        <CopyableList title={t("cvBullets")} items={analysis.suggestions} />
      )}

      {/* Cover letter */}
      {(() => {
        const draft = (analysis.rawResult as { coverLetterDraft?: string } | null)?.coverLetterDraft;
        return draft ? <CoverLetterBlock text={draft} /> : null;
      })()}
    </div>
  );
}

function ScoreCircle({ score }: { score: number | null }) {
  const t = useTranslations("aiPanel");

  if (score === null || score === undefined) {
    return (
      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-border text-xs text-muted-foreground">
        {t("na")}
      </div>
    );
  }
  const color =
    score >= 80
      ? "text-success border-success/30 bg-success/10"
      : score >= 50
        ? "text-warning border-warning/30 bg-warning/10"
        : "text-destructive border-destructive/30 bg-destructive/10";
  return (
    <div
      className={cn(
        "flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-full border-2",
        color,
      )}
    >
      <span className="text-xl font-bold">{score}</span>
      <span className="text-[10px] uppercase tracking-wide opacity-70">{t("match")}</span>
    </div>
  );
}

function BulletList({
  title,
  icon,
  items,
  empty,
}: {
  title: string;
  icon: React.ReactNode;
  items: string[];
  empty: string;
}) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {icon}
        {title}
      </p>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((it, i) => (
            <li key={i} className="text-sm leading-5">
              {it}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CopyableList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <ul className="space-y-1.5">
        {items.map((it, i) => (
          <CopyableItem key={i} text={it} />
        ))}
      </ul>
    </div>
  );
}

function CopyableItem({ text }: { text: string }) {
  const t = useTranslations("aiPanel");
  const [copied, setCopied] = useState(false);
  return (
    <li className="group flex items-start justify-between gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50">
      <span className="text-sm leading-5">{text}</span>
      <button
        type="button"
        onClick={async () => {
          await navigator.clipboard.writeText(text);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="shrink-0 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
        aria-label={t("copyAria")}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </li>
  );
}

function CoverLetterBlock({ text }: { text: string }) {
  const t = useTranslations("aiPanel");
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("coverLetterDraft")}
        </p>
        <Button
          variant="ghost"
          size="xs"
          onClick={async () => {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
          className="gap-1.5"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-success" /> {t("copied")}
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" /> {t("copy")}
            </>
          )}
        </Button>
      </div>
      <p className="whitespace-pre-wrap text-sm leading-6 text-foreground/90">{text}</p>
    </div>
  );
}

