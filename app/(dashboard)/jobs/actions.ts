"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApplicationStatus } from "@prisma/client";
import { z } from "zod";

import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jobFormSchema } from "@/lib/validations/job";
import { parseJob } from "@/lib/ai/job-parser";
import { embedJob } from "@/lib/ai/embeddings";

// ─── Background enrichment ───────────────────────────────────────────────────

/**
 * Response gönderildikten sonra çalışır (after): description'ı parseJob ile
 * damıtır, sonra embedding'i yeniler. Sıra önemli — embed metni structured
 * alanları kullandığı için önce parse, sonra embed.
 * Hatalar loglanır ama kullanıcı akışını asla bozmaz (enrichment opsiyoneldir).
 */
function scheduleJobEnrichment(jobId: string, userId: string, reparse: boolean) {
  after(async () => {
    if (reparse) {
      try {
        const job = await prisma.job.findFirst({
          where:  { id: jobId, userId },
          select: { description: true },
        });
        if (job?.description) {
          const analysis = await parseJob(job.description);
          await prisma.job.updateMany({
            where: { id: jobId, userId },
            data: {
              mustHaves:          analysis.must_haves,
              niceToHaves:        analysis.nice_to_haves,
              minYearsExperience: analysis.min_years_experience,
              parsedAt:           new Date(),
            },
          });
        }
      } catch (e) {
        console.error(`[jobs] background requirements parse failed for ${jobId}:`, e);
      }
    }

    try {
      await embedJob(jobId, userId);
    } catch (e) {
      console.error(`[jobs] background embedding failed for ${jobId}:`, e);
    }
  });
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
    },
  });

  scheduleJobEnrichment(job.id, userId, Boolean(data.description));

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
    },
  });

  if (result.count === 0) {
    throw new Error("Job not found or you don't have access.");
  }

  const descriptionChanged =
    (data.description ?? null) !== (existing?.description ?? null);
  const reparse =
    Boolean(data.description) && (descriptionChanged || !existing?.parsedAt);
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
