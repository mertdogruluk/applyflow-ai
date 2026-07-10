import type { NotificationType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

interface CreateNotificationInput {
  type: NotificationType;
  title: string;
  body?: string;
  jobId?: string;
}

/**
 * Kullanıcıya bildirim satırı yazar. Bildirim üretimi hiçbir ana akışı
 * bozmamalı — bu yüzden hata yutulur ve sadece loglanır (enrichment.ts ile
 * aynı savunmacı desen). Await edilmese de güvenlidir.
 */
export async function createNotification(
  userId: string,
  input: CreateNotificationInput,
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type:  input.type,
        title: input.title,
        body:  input.body ?? null,
        jobId: input.jobId ?? null,
      },
    });
  } catch (error) {
    console.error(
      `[notifications] failed to create ${input.type} for user ${userId}:`,
      error,
    );
  }
}
