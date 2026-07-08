"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApplicationStatus } from "@prisma/client";
import { z } from "zod";

import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jobFormSchema } from "@/lib/validations/job";
import { parseJob, JobTooShortError, JobParserError, type JobAnalysis } from "@/lib/ai/job-parser";
import { GeminiError, MissingApiKeyError } from "@/lib/ai/gemini";
import { scheduleJobEnrichment } from "@/lib/jobs/enrichment";

// ─── Analyze (form-time, persist yok) ────────────────────────────────────────

/**
 * Result-object sözleşmesi: Server Action'da fırlatılan mesajlar production'da
 * maskelenir; "ilan çok kısa" gibi kullanıcıya gösterilecek hatalar aynen
 * taşınmalı. Bilinmeyen hatalar throw edilmeye devam eder.
 */
export type AnalyzeJobResult =
  | { ok: true; analysis: JobAnalysis }
  | { ok: false; error: string };

/**
 * Form üzerindeki "Analyze with AI" butonunun action'ı. Job henüz var olmadığı
 * için hiçbir şey persist etmez — çıktı react-hook-form alanlarına yazılır ve
 * submit'te createJob/updateJob tarafından kaydedilir.
 */
export async function analyzeJobDescription(rawText: unknown): Promise<AnalyzeJobResult> {
  await requireUserId();

  if (typeof rawText !== "string" || rawText.trim().length === 0) {
    return { ok: false, error: "Paste a job posting first." };
  }

  try {
    const analysis = await parseJob(rawText);
    return { ok: true, analysis };
  } catch (e) {
    if (
      e instanceof JobTooShortError ||
      e instanceof JobParserError ||
      e instanceof GeminiError ||
      e instanceof MissingApiKeyError
    ) {
      return { ok: false, error: e.message };
    }
    throw e;
  }
}

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createJob(rawData: unknown) {
  const userId = await requireUserId();

  const parsed = jobFormSchema.safeParse(rawData);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((e) => e.message).join(", ");
    throw new Error(`Validation failed: ${messages}`);
  }
  const data = parsed.data;

  // Form üzerinde AI analizi yapıldıysa çıktı hazır gelir — doğrudan persist
  // edilir ve arka planda parseJob TEKRAR çağrılmaz (tek Gemini maliyeti).
  const hasFormAnalysis = Array.isArray(data.mustHaves);

  const job = await prisma.job.create({
    data: {
      userId,
      title:       data.title,
      company:     data.company,
      status:      data.status,
      location:    data.location,
      workType:    data.workType ?? "HYBRID",
      jobType:     data.jobType  ?? "FULL_TIME",
      jobUrl:      data.url,
      salary:      data.salaryRange,
      source:      data.source,
      description: data.description,
      notes:       data.notes,
      cvVersion:   data.cvVersion,
      coverLetter: data.coverLetter,
      appliedAt:   data.appliedAt,
      deadline:    data.reminderDate,
      mustHaves:          data.mustHaves ?? [],
      niceToHaves:        data.niceToHaves ?? [],
      minYearsExperience: data.minYearsExperience ?? null,
      parsedAt:           hasFormAnalysis ? new Date() : null,
    },
  });

  scheduleJobEnrichment(job.id, userId, Boolean(data.description) && !hasFormAnalysis);

  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  redirect("/jobs");
}

// ─── Update ──────────────────────────────────────────────────────────────────

export async function updateJob(jobId: string, rawData: unknown) {
  const userId = await requireUserId();

  const parsed = jobFormSchema.safeParse(rawData);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((e) => e.message).join(", ");
    throw new Error(`Validation failed: ${messages}`);
  }
  const data = parsed.data;

  // Description değişti mi / hiç parse edilmedi mi? (gereksiz Gemini çağrısını önle)
  const existing = await prisma.job.findFirst({
    where:  { id: jobId, userId },
    select: { description: true, parsedAt: true },
  });

  // Formda taze AI analizi varsa (mustHaves gönderilmiş) doğrudan persist;
  // yoksa mevcut parsed alanlara dokunma (undefined → Prisma alanı atlar).
  const hasFormAnalysis = Array.isArray(data.mustHaves);

  // Sadece kendi kaydı güncellenebilir
  const result = await prisma.job.updateMany({
    where: { id: jobId, userId },
    data: {
      title:       data.title,
      company:     data.company,
      status:      data.status,
      location:    data.location ?? null,
      workType:    data.workType ?? "HYBRID",
      jobType:     data.jobType  ?? "FULL_TIME",
      jobUrl:      data.url ?? null,
      salary:      data.salaryRange ?? null,
      source:      data.source ?? null,
      description: data.description ?? null,
      notes:       data.notes ?? null,
      cvVersion:   data.cvVersion ?? null,
      coverLetter: data.coverLetter ?? null,
      appliedAt:   data.appliedAt ?? null,
      deadline:    data.reminderDate ?? null,
      mustHaves:          hasFormAnalysis ? data.mustHaves : undefined,
      niceToHaves:        hasFormAnalysis ? (data.niceToHaves ?? []) : undefined,
      minYearsExperience: hasFormAnalysis ? (data.minYearsExperience ?? null) : undefined,
      parsedAt:           hasFormAnalysis ? new Date() : undefined,
    },
  });

  if (result.count === 0) {
    throw new Error("Job not found or you don't have access.");
  }

  const descriptionChanged =
    (data.description ?? null) !== (existing?.description ?? null);
  const reparse =
    !hasFormAnalysis &&
    Boolean(data.description) &&
    (descriptionChanged || !existing?.parsedAt);
  scheduleJobEnrichment(jobId, userId, reparse);

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/dashboard");
  redirect(`/jobs/${jobId}`);
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deleteJob(jobId: string) {
  const userId = await requireUserId();

  const result = await prisma.job.deleteMany({
    where: { id: jobId, userId },
  });

  if (result.count === 0) {
    throw new Error("Job not found or you don't have access.");
  }

  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  redirect("/jobs");
}

// ─── Quick status update ─────────────────────────────────────────────────────

const statusUpdateSchema = z.object({
  jobId:  z.string().min(1),
  status: z.nativeEnum(ApplicationStatus),
});

export async function updateJobStatus(input: { jobId: string; status: ApplicationStatus }) {
  const userId = await requireUserId();

  const parsed = statusUpdateSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Invalid status update.");
  }

  const result = await prisma.job.updateMany({
    where: { id: parsed.data.jobId, userId },
    data:  { status: parsed.data.status },
  });

  if (result.count === 0) {
    throw new Error("Job not found or you don't have access.");
  }

  revalidatePath("/jobs");
  revalidatePath(`/jobs/${parsed.data.jobId}`);
  revalidatePath("/dashboard");
}
