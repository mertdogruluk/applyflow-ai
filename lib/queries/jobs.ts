import { prisma } from "@/lib/prisma";

/**
 * Tek bir iş kaydını sahibine göre döner.
 * userId eşleşmezse veya kayıt yoksa null döner — yetkisiz erişim sızdırmaz.
 */
export async function getJobByIdForUser(jobId: string, userId: string) {
  return prisma.job.findFirst({
    where: { id: jobId, userId },
    include: {
      analysis: true,
      projects: {
        include: { project: true },
        orderBy: { createdAt: "asc" },
      },
      reminders: {
        orderBy: { dueAt: "asc" },
      },
    },
  });
}

export type JobWithRelations = NonNullable<Awaited<ReturnType<typeof getJobByIdForUser>>>;

export async function getJobsByUser(userId: string) {
  return prisma.job.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}
