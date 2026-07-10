// Tarih ve sayı formatlama yardımcıları.
// Tüm UI boyunca tek noktadan locale ve format kontrolü.
// locale parametresi i18n cookie'sinden gelir (useLocale / getLocale);
// verilmezse İngilizce biçim kullanılır.

const LOCALE_TAG: Record<string, string> = { en: "en-GB", tr: "tr-TR" };

function toTag(locale?: string): string {
  return LOCALE_TAG[locale ?? "en"] ?? "en-GB";
}

export function formatDate(
  value: Date | string | null | undefined,
  locale?: string,
  fallback = "—",
): string {
  if (!value) return fallback;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  return new Intl.DateTimeFormat(toTag(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function formatDateTime(
  value: Date | string | null | undefined,
  locale?: string,
  fallback = "—",
): string {
  if (!value) return fallback;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return fallback;
  return new Intl.DateTimeFormat(toTag(locale), {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/**
 * Göreli zaman — Intl.RelativeTimeFormat ile locale'e uygun üretilir
 * ("5 minutes ago" / "5 dakika önce"); katalog anahtarı gerekmez.
 */
export function relativeTime(
  value: Date | string | null | undefined,
  locale?: string,
): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";

  const diffSec = Math.round((d.getTime() - Date.now()) / 1000);
  const abs = Math.abs(diffSec);
  const rtf = new Intl.RelativeTimeFormat(toTag(locale), { numeric: "auto" });

  if (abs < 60) return rtf.format(Math.trunc(diffSec / 1), "second");
  if (abs < 3600) return rtf.format(Math.trunc(diffSec / 60), "minute");
  if (abs < 86_400) return rtf.format(Math.trunc(diffSec / 3600), "hour");
  if (abs < 30 * 86_400) return rtf.format(Math.trunc(diffSec / 86_400), "day");
  return formatDate(d, locale);
}

export function toDateInputValue(value: Date | string | null | undefined): string {
  if (!value) return "";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}
