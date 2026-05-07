import type { ApplicationStatus } from "@prisma/client";

/**
 * Tek noktadan status etiketi ve rengi.
 * Prisma enum'unu rename etmemek için label'ları burada eşliyoruz.
 *  - WISHLIST   → "Saved"
 *  - ASSESSMENT → "Technical Test"
 */
export const STATUS_CONFIG: Record<
  ApplicationStatus,
  {
    label: string;
    /** Hafif renkli rozet için Tailwind sınıfları (badge / pill) */
    badge: string;
    /** Liste/sıralama için sıra */
    order: number;
  }
> = {
  WISHLIST:   { label: "Saved",          order: 1, badge: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300" },
  APPLIED:    { label: "Applied",        order: 2, badge: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300" },
  ASSESSMENT: { label: "Technical Test", order: 3, badge: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  INTERVIEW:  { label: "Interview",      order: 4, badge: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300" },
  OFFER:      { label: "Offer",          order: 5, badge: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  ACCEPTED:   { label: "Accepted",       order: 6, badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200" },
  REJECTED:   { label: "Rejected",       order: 7, badge: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300" },
  WITHDRAWN:  { label: "Withdrawn",      order: 8, badge: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500" },
};

/** Form ve filtreler için sıralı seçenekler */
export const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = (
  Object.entries(STATUS_CONFIG) as [ApplicationStatus, (typeof STATUS_CONFIG)[ApplicationStatus]][]
)
  .sort((a, b) => a[1].order - b[1].order)
  .map(([value, cfg]) => ({ value, label: cfg.label }));

/** "Aktif" sayılan başvuru durumları (analytics ve dashboard için) */
export const ACTIVE_STATUSES: ApplicationStatus[] = [
  "APPLIED",
  "ASSESSMENT",
  "INTERVIEW",
  "OFFER",
];
