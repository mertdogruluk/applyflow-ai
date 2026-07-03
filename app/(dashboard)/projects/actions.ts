"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { projectFormSchema } from "@/lib/validations/project";
import { embedProject } from "@/lib/ai/embeddings";

/**
 * Response sonrası arka planda embedding yeniler; hata akışı bozmaz.
 * embedProject içindeki stale-check gereksiz API çağrısını zaten önler.
 */
function scheduleProjectEmbedding(projectId: string, userId: string) {
  after(async () => {
    try {
      await embedProject(projectId, userId);
    } catch (e) {
      console.error(`[projects] background embedding failed for ${projectId}:`, e);
    }
  });
}

// ─── Create ──────────────────────────────────────────────────────────────────

export async function createProject(rawData: unknown) {
  const userId = await requireUserId();

  const parsed = projectFormSchema.safeParse(rawData);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((e) => e.message).join(", ");
    throw new Error(`Validation failed: ${messages}`);
  }
  const data = parsed.data;

  const project = await prisma.project.create({
    data: {
      userId,
      name:        data.name,
      description: data.description,
      githubUrl:   data.githubUrl,
      liveUrl:     data.liveUrl,
      techStack:   data.techStackInput,
    },
  });

  scheduleProjectEmbedding(project.id, userId);

  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

// ─── Update ──────────────────────────────────────────────────────────────────

export async function updateProject(projectId: string, rawData: unknown) {
  const userId = await requireUserId();

  const parsed = projectFormSchema.safeParse(rawData);
  if (!parsed.success) {
    const messages = parsed.error.issues.map((e) => e.message).join(", ");
    throw new Error(`Validation failed: ${messages}`);
  }
  const data = parsed.data;

  const result = await prisma.project.updateMany({
    where: { id: projectId, userId },
    data: {
      name:        data.name,
      description: data.description ?? null,
      githubUrl:   data.githubUrl ?? null,
      liveUrl:     data.liveUrl ?? null,
      techStack:   data.techStackInput,
    },
  });

  if (result.count === 0) {
    throw new Error("Project not found or you don't have access.");
  }

  scheduleProjectEmbedding(projectId, userId);

  revalidatePath("/projects");
  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}`);
}

// ─── Delete ──────────────────────────────────────────────────────────────────

export async function deleteProject(projectId: string) {
  const userId = await requireUserId();

  const result = await prisma.project.deleteMany({
    where: { id: projectId, userId },
  });

  if (result.count === 0) {
    throw new Error("Project not found or you don't have access.");
  }

  revalidatePath("/projects");
  redirect("/projects");
}
