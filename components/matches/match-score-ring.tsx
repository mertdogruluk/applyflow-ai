import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

/**
 * Skor eşiği → renk eşlemesi (spec):
 *   ≥ 80  yeşil (güçlü eşleşme)
 *   50-79 sarı/amber (orta)
 *   < 50  kırmızı (zayıf)
 * Etiketler i18n anahtarıdır — render'da çevrilir.
 */
function getScoreTone(score: number) {
  if (score >= 80) {
    return {
      ring:     "stroke-success",
      text:     "text-success",
      labelKey: "ringStrong" as const,
    };
  }
  if (score >= 50) {
    return {
      ring:     "stroke-warning",
      text:     "text-warning",
      labelKey: "ringModerate" as const,
    };
  }
  return {
    ring:     "stroke-destructive",
    text:     "text-destructive",
    labelKey: "ringWeak" as const,
  };
}

const RADIUS = 32;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface MatchScoreRingProps {
  /** 0-100 arası hakem skoru. */
  score: number;
  className?: string;
}

/**
 * Kütüphanesiz dairesel skor halkası. İki SVG circle: alttaki iz (muted),
 * üstteki skor oranında dolan yay. stroke-dashoffset transition'ı sayesinde
 * kart ekrana geldiğinde halka animasyonla dolar.
 */
export function MatchScoreRing({ score, className }: MatchScoreRingProps) {
  const t = useTranslations("matches");
  const clamped = Math.max(0, Math.min(100, Math.round(score)));
  const tone = getScoreTone(clamped);
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div className={cn("flex flex-col items-center gap-1", className)}>
      <div
        className="relative size-20"
        role="meter"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={t("ringAria", { score: clamped })}
      >
        <svg viewBox="0 0 80 80" className="size-full -rotate-90">
          <circle
            cx="40"
            cy="40"
            r={RADIUS}
            fill="none"
            strokeWidth="7"
            className="stroke-muted"
          />
          <circle
            cx="40"
            cy="40"
            r={RADIUS}
            fill="none"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            className={cn(
              "transition-[stroke-dashoffset] duration-700 ease-out",
              tone.ring,
            )}
          />
        </svg>
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center text-lg font-semibold tabular-nums",
            tone.text,
          )}
        >
          {clamped}
        </span>
      </div>
      <span className="text-xs font-medium text-muted-foreground">{t(tone.labelKey)}</span>
    </div>
  );
}
