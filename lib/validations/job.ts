import { z } from "zod";
import { ApplicationStatus, WorkType, JobType } from "@prisma/client";

// ─── Enums ────────────────────────────────────────────────────────────────────
// Etiketler i18n kataloğunda (`status.*`, `workType.*`, `jobType.*`) —
// burada yalnızca kararlı enum değerleri ve sıraları tutulur.

export const APPLICATION_STATUS_VALUES: ApplicationStatus[] = [
  "WISHLIST",
  "APPLIED",
  "ASSESSMENT",
  "INTERVIEW",
  "OFFER",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
];

export const WORK_TYPE_VALUES: WorkType[] = ["REMOTE", "HYBRID", "ON_SITE"];

export const JOB_TYPE_VALUES: JobType[] = [
  "FULL_TIME",
  "PART_TIME",
  "INTERNSHIP",
  "CONTRACT",
  "FREELANCE",
];

// ─── Schema ───────────────────────────────────────────────────────────────────

export const jobFormSchema = z.object({
  // Zorunlu alanlar
  // Hata mesajları i18n anahtarıdır — FieldError bileşeni t() ile çevirir.
  title:   z.string().min(1, "validation.titleRequired"),
  company: z.string().min(1, "validation.companyRequired"),
  status:  z.nativeEnum(ApplicationStatus, {
    error: "validation.statusRequired",
  }),

  // Opsiyonel — URL boşsa undefined kabul et, doluysa geçerli URL olmalı
  url: z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : v))
    .pipe(z.url("validation.invalidUrl").optional())
    .optional(),

  // Opsiyonel string alanlar
  source:      z.string().trim().optional(),
  location:    z.string().trim().optional(),
  salaryRange: z.string().trim().optional(),
  description: z.string().trim().optional(),
  notes:       z.string().trim().optional(),
  cvVersion:   z.string().trim().optional(),
  coverLetter: z.string().trim().optional(),

  // Enum alanlar
  workType: z.nativeEnum(WorkType).optional(),
  jobType:  z.nativeEnum(JobType).optional(),

  // Tarih alanları — date input'tan string gelir, Date'e dönüştür
  appliedAt:    z.string().optional().transform((v) => (v ? new Date(v) : undefined)),
  reminderDate: z.string().optional().transform((v) => (v ? new Date(v) : undefined)),

  // AI analiz çıktısı (gizli alanlar) — JobAiAnalyzer setValue ile doldurur.
  // Formda input'u yoktur; doluysa server bunları doğrudan persist eder ve
  // arka planda parseJob tekrar çağrılmaz (çifte Gemini maliyeti önlenir).
  mustHaves:          z.array(z.string().min(1).max(80)).max(50).optional(),
  niceToHaves:        z.array(z.string().min(1).max(80)).max(50).optional(),
  minYearsExperience: z.number().min(0).max(60).nullable().optional(),
});

export type JobFormValues = z.input<typeof jobFormSchema>;
export type JobFormOutput = z.output<typeof jobFormSchema>;
