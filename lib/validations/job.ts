import { z } from "zod";
import { ApplicationStatus, WorkType, JobType } from "@prisma/client";

// ─── Enums ────────────────────────────────────────────────────────────────────

export const APPLICATION_STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: "WISHLIST",   label: "Wishlist" },
  { value: "APPLIED",    label: "Applied" },
  { value: "ASSESSMENT", label: "Assessment" },
  { value: "INTERVIEW",  label: "Interview" },
  { value: "OFFER",      label: "Offer" },
  { value: "ACCEPTED",   label: "Accepted" },
  { value: "REJECTED",   label: "Rejected" },
  { value: "WITHDRAWN",  label: "Withdrawn" },
];

export const WORK_TYPE_OPTIONS: { value: WorkType; label: string }[] = [
  { value: "REMOTE",  label: "Remote" },
  { value: "HYBRID",  label: "Hybrid" },
  { value: "ON_SITE", label: "On-site" },
];

export const JOB_TYPE_OPTIONS: { value: JobType; label: string }[] = [
  { value: "FULL_TIME",  label: "Full-time" },
  { value: "PART_TIME",  label: "Part-time" },
  { value: "INTERNSHIP", label: "Internship" },
  { value: "CONTRACT",   label: "Contract" },
  { value: "FREELANCE",  label: "Freelance" },
];

// ─── Schema ───────────────────────────────────────────────────────────────────

export const jobFormSchema = z.object({
  // Zorunlu alanlar
  title:   z.string().min(1, "Job title is required"),
  company: z.string().min(1, "Company name is required"),
  status:  z.nativeEnum(ApplicationStatus, {
    error: "Status is required",
  }),

  // Opsiyonel — URL boşsa undefined kabul et, doluysa geçerli URL olmalı
  url: z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : v))
    .pipe(z.url("Please enter a valid URL (e.g. https://...)").optional())
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
});

export type JobFormValues = z.input<typeof jobFormSchema>;
export type JobFormOutput = z.output<typeof jobFormSchema>;
