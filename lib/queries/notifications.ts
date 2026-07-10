import { prisma } from "@/lib/prisma";

/**
 * Zil paneli için son bildirimler. lib/queries deseninde: userId ilk argüman,
 * her sorgu userId ile izole, çağıran requireUserId ile kimliği çözer.
 */
export async function getNotifications(userId: string, limit = 20) {
  return prisma.notification.findMany({
    where:   { userId },
    orderBy: { createdAt: "desc" },
    take:    limit,
  });
}

export type NotificationItem = Awaited<
  ReturnType<typeof getNotifications>
>[number];

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}
