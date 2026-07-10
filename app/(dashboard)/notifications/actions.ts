"use server";

import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getNotifications,
  getUnreadCount,
  type NotificationItem,
} from "@/lib/queries/notifications";

/**
 * Zil popover'ı client component olduğu için veriyi action üzerinden çeker.
 * Result-object sözleşmesi: bilinen hatalar ok:false ile döner, bilinmeyenler
 * throw edilir (production'da maskelenir).
 */
export type FetchNotificationsResult =
  | { ok: true; items: NotificationItem[]; unreadCount: number }
  | { ok: false; error: string };

export async function fetchNotifications(): Promise<FetchNotificationsResult> {
  const userId = await requireUserId();

  try {
    const [items, unreadCount] = await Promise.all([
      getNotifications(userId, 20),
      getUnreadCount(userId),
    ]);
    return { ok: true, items, unreadCount };
  } catch (e) {
    console.error("[notifications] fetch failed:", e);
    return { ok: false, error: "Could not load notifications." };
  }
}

export async function markAllRead(): Promise<{ ok: boolean }> {
  const userId = await requireUserId();

  await prisma.notification.updateMany({
    where: { userId, read: false },
    data:  { read: true },
  });

  return { ok: true };
}

export async function markRead(id: string): Promise<{ ok: boolean }> {
  const userId = await requireUserId();

  // updateMany + userId: sahiplik garantisi (yabancı id sessizce 0 satır etkiler).
  await prisma.notification.updateMany({
    where: { id, userId },
    data:  { read: true },
  });

  return { ok: true };
}
