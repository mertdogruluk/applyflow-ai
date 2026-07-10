// Job kayıtları için arka plan AI zenginleştirmesi.
// jobs/actions.ts içinden buraya taşındı: "use server" dosyaları yalnızca
// async action export edebildiği için bu sync helper orada paylaşılamıyordu.
// Artık hem jobs hem matches (Save to my jobs) action'ları kullanıyor.

import { after } from "next/server";
import { getTranslations } from "next-intl/server";

import { prisma } from "@/lib/prisma";
import { parseJob } from "@/lib/ai/job-parser";
import { embedJob } from "@/lib/ai/embeddings";
import { createNotification } from "@/lib/notifications/create";

/**
 * Response gönderildikten sonra çalışır (after): description'ı parseJob ile
 * damıtır, sonra embedding'i yeniler. Sıra önemli — embed metni structured
 * alanları kullandığı için önce parse, sonra embed.
 * Hatalar loglanır ama kullanıcı akışını asla bozmaz (enrichment opsiyoneldir).
 */
export function scheduleJobEnrichment(jobId: string, userId: string, reparse: boolean) {
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

      // Zenginleştirme bitti — ilan artık eşleştirilebilir. Bildirim üretimi
      // kendi içinde hata yutar, akışı etkilemez.
      const job = await prisma.job.findFirst({
        where:  { id: jobId, userId },
        select: { title: true, company: true },
      });
      if (job) {
        // after() içinde request bağlamı hâlâ okunabilir; yine de çeviri
        // başarısız olursa İngilizce'ye düş (bildirim asla akışı bozmaz).
        let title = `"${job.title}" is ready for matching`;
        let body = `${job.company} — AI indexed the posting in the background.`;
        try {
          const t = await getTranslations("notifications");
          title = t("enrichedTitle", { title: job.title });
          body = t("enrichedBody", { company: job.company });
        } catch {
          /* varsayılan İngilizce metin kalır */
        }
        await createNotification(userId, { type: "JOB_ENRICHED", title, body, jobId });
      }
    } catch (e) {
      console.error(`[jobs] background embedding failed for ${jobId}:`, e);
    }
  });
}
