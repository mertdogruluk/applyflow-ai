"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ApplicationStatus } from "@prisma/client";
import { z } from "zod";

import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jobFormSchema } from "@/lib/validations/job";

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createJob(rawData: unknown) {
  const userId = await requireUserId();

  const parsed = jobFormSchema.safeParse(rawData);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((e) => e.message).join(", ");
    throw new Error(`Validation failed: ${messages}`);
  }
  const data = parsed.data;

  await prisma.job.create({
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
