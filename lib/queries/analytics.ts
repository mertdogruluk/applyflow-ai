import { ApplicationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { ACTIVE_STATUSES } from "@/lib/status";

export interface JobStats {
  total:       number;
  byStatus:    Record<ApplicationStatus, number>;
  active:      number;
  interview:   number;
  offer:       number;
  rejected:    number;
  responseRate: number;       // (Interview + Offer + Rejected) / Applied
  interviewRate: number;      // Interview / Applied
}

const EMPTY_BY_STATUS: Record<ApplicationStatus, number> = {
  WISHLIST:   0,
  APPLIED:    0,
  ASSESSMENT: 0,
  INTERVIEW:  0,
  OFFER:      0,
  ACCEPTED:   0,
  REJECTED:   0,
  WITHDRAWN:  0,
};

export async function getJobStats(userId: string): Promise<JobStats> {
  const grouped = await prisma.job.groupBy({
    by: ["status"],
    where: { userId },
    _count: true,
  });

  const byStatus = { ...EMPTY_BY_STATUS };
  for (const row of grouped) {
    byStatus[row.status] = row._count;
  }

  const total = Object.values(byStatus).reduce((s, n) => s + n, 0);
  const active = ACTIVE_STATUSES.reduce((s, k) => s + byStatus[k], 0);
  const applied = byStatus.APPLIED + byStatus.ASSESSMENT + byStatus.INTERVIEW + byStatus.OFFER + byStatus.ACCEPTED + byStatus.REJECTED;
  const interview = byStatus.INTERVIEW + byStatus.OFFER + byStatus.ACCEPTED;
  const offer = byStatus.OFFER + byStatus.ACCEPTED;
  const rejected = byStatus.REJECTED;

  const responseRate  = applied > 0 ? Math.round(((interview + rejected) / applied) * 100) : 0;
  const interviewRate = applied > 0 ? Math.round((interview / applied) * 100) : 0;

  return {
    total,
    byStatus,
    active,
    interview,
    offer,
    rejected,
    responseRate,
    interviewRate,
  };
}

export interface MonthlyPoint {
  month: string;   // "2026-05" formatında
  label: string;   // "May" formatında
  count: number;
}

/** Son N ay için ay bazında başvuru sayısı (createdAt'e göre). */
export async function getMonthlyApplications(userId: string, months = 6): Promise<MonthlyPoint[]> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  const jobs = await prisma.job.findMany({
    where: { userId, createdAt: { gte: start } },
    select: { createdAt: true },
  });

  const buckets = new Map<string, number>();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - (months - 1 - i), 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    buckets.set(key, 0);
  }

  for (const j of jobs) {
    const d = j.createdAt;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  return Array.from(buckets.entries()).map(([key, count]) => {
    const [, m] = key.split("-");
    const label = new Date(Number(key.slice(0, 4)), Number(m) - 1, 1).toLocaleString("en-US", {
      month: "short",
    });
    return { month: key, label, count };
  });
}

export async function getRecentJobs(userId: string, limit = 5) {
  return prisma.job.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

export async function getUpcomingDeadlines(userId: string, limit = 5) {
  return prisma.job.findMany({
    where: {
      userId,
      deadline: { gte: new Date() },
    },
    orderBy: { deadline: "asc" },
    take: limit,
  });
}
