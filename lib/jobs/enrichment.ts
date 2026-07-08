// Job kayıtları için arka plan AI zenginleştirmesi.
// jobs/actions.ts içinden buraya taşındı: "use server" dosyaları yalnızca
// async action export edebildiği için bu sync helper orada paylaşılamıyordu.
// Artık hem jobs hem matches (Save to my jobs) action'ları kullanıyor.

import { after } from "next/server";

import { prisma } from "@/lib/prisma";
import { parseJob } from "@/lib/ai/job-parser";
import { embedJob } from "@/lib/ai/embeddings";

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
    } catch (e) {
      console.error(`[jobs] background embedding failed for ${jobId}:`, e);
    }
  });
}
