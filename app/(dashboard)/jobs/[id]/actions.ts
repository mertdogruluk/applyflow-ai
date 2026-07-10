"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runAnalysis } from "@/lib/ai/analysis";
import { createNotification } from "@/lib/notifications/create";

// ─── Project link/unlink ─────────────────────────────────────────────────────

async function assertJobOwnership(jobId: string, userId: string) {
  const job = await prisma.job.findFirst({
    where: { id: jobId, userId },
    select: { id: true },
  });
  if (!job) throw new Error("Job not found or you don't have access.");
}

async function assertProjectOwnership(projectId: string, userId: string) {
  const project = await prisma.project.findFirst({
    where: { id: projectId, userId },
    select: { id: true },
  });
  if (!project) throw new Error("Project not found or you don't have access.");
}

export async function linkProjectToJob(jobId: string, projectId: string) {
  const userId = await requireUserId();
  await assertJobOwnership(jobId, userId);
  await assertProjectOwnership(projectId, userId);

  await prisma.jobProject.upsert({
    where:  { jobId_projectId: { jobId, projectId } },
    create: { jobId, projectId },
    update: {},
  });

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/projects/${projectId}`);
}

export async function unlinkProjectFromJob(jobId: string, projectId: string) {
  const userId = await requireUserId();
  await assertJobOwnership(jobId, userId);
  await assertProjectOwnership(projectId, userId);

  await prisma.jobProject.deleteMany({
    where: { jobId, projectId },
  });

  revalidatePath(`/jobs/${jobId}`);
  revalidatePath(`/projects/${projectId}`);
}

// ─── AI Analysis ─────────────────────────────────────────────────────────────

export async function generateAnalysis(jobId: string) {
  const userId = await requireUserId();

  const job = await prisma.job.findFirst({
    where: { id: jobId, userId },
    include: {
      projects: {
        include: { project: true },
      },
    },
  });
  if (!job) throw new Error("Job not found or you don't have access.");

  const linkedProjects = job.projects.map((jp) => ({
    name:        jp.project.name,
    description: jp.project.description,
    techStack:   jp.project.techStack,
  }));

  // AI çağrısını yap (Gemini API key yoksa burada anlamlı hata atar)
  const result = await runAnalysis({
    title:       job.title,
    company:     job.company,
    description: job.description,
    projects:    linkedProjects,
  });

  // Tek analiz tutuyoruz (AiAnalysis.jobId @unique) — varsa güncelle, yoksa oluştur
  await prisma.aiAnalysis.upsert({
    where:  { jobId },
    create: {
      jobId,
      summary:     result.summary,
      matchScore:  result.matchScore,
      strengths:   result.strengths,
      weaknesses:  result.missingKeywords,
      suggestions: result.recommendedCvBullets,
      rawResult:   result as unknown as object,
    },
    update: {
      summary:     result.summary,
      matchScore:  result.matchScore,
      strengths:   result.strengths,
      weaknesses:  result.missingKeywords,
      suggestions: result.recommendedCvBullets,
      rawResult:   result as unknown as object,
    },
  });

  const t = await getTranslations("notifications");
  await createNotification(userId, {
    type:  "ANALYSIS_READY",
    title: t("analysisTitle", { title: job.title }),
    body:
      result.matchScore !== null && result.matchScore !== undefined
        ? t("analysisBodyScore", { score: result.matchScore })
        : t("analysisBody"),
    jobId,
  });

  revalidatePath(`/jobs/${jobId}`);
}
