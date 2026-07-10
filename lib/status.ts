import type { ApplicationStatus } from "@prisma/client";

/**
 * Tek noktadan status rengi ve sırası. Görüntü ETİKETLERİ artık burada değil —
 * i18n kataloğunda (`status.<ENUM>`) yaşar; bileşenler useTranslations("status")
 * ile çevirir. Enum değerleri kararlı anahtardır.
 */
export const STATUS_CONFIG: Record<
  ApplicationStatus,
  {
    /** Hafif renkli rozet için Tailwind sınıfları (badge / pill) */
    badge: string;
    /** Liste/sıralama için sıra */
    order: number;
  }
> = {
  WISHLIST:   { order: 1, badge: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  APPLIED:    { order: 2, badge: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  ASSESSMENT: { order: 3, badge: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  INTERVIEW:  { order: 4, badge: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
  OFFER:      { order: 5, badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  ACCEPTED:   { order: 6, badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  REJECTED:   { order: 7, badge: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300" },
  WITHDRAWN:  { order: 8, badge: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500" },
};

/** Form ve filtreler için sıralı enum değerleri (etiket render'da çevrilir). */
export const STATUS_VALUES: ApplicationStatus[] = (
  Object.entries(STATUS_CONFIG) as [ApplicationStatus, (typeof STATUS_CONFIG)[ApplicationStatus]][]
)
  .sort((a, b) => a[1].order - b[1].order)
  .map(([value]) => value);

/** "Aktif" sayılan başvuru durumları (analytics ve dashboard için) */
export const ACTIVE_STATUSES: ApplicationStatus[] = [
  "APPLIED",
  "ASSESSMENT",
  "INTERVIEW",
  "OFFER",
];
