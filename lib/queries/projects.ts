import { prisma } from "@/lib/prisma";

export async function getProjectsByUser(userId: string) {
  return prisma.project.findMany({
    where:   { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { jobs: true } },
    },
  });
}

export async function getProjectByIdForUser(projectId: string, userId: string) {
  return prisma.project.findFirst({
    where: { id: projectId, userId },
    include: {
      jobs: {
        include: { job: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
}

export type ProjectWithRelations = NonNullable<
  Awaited<ReturnType<typeof getProjectByIdForUser>>
>;
