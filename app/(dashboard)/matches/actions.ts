"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";

import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  findBestMatches,
  CandidateProfileMissingError,
  MatchEngineError,
  type JobMatch,
} from "@/lib/ai/match-engine";
import { GeminiError, MissingApiKeyError } from "@/lib/ai/gemini";
import { GeminiEmbeddingError } from "@/lib/ai/embeddings";
import { discoverMatchingJobs } from "@/lib/discovery/engine";
import { DiscoveryError } from "@/lib/discovery/remotive";
import { scheduleJobEnrichment } from "@/lib/jobs/enrichment";
import { createNotification } from "@/lib/notifications/create";
import type { DiscoveredMatch, DiscoveryFilters } from "@/lib/discovery/types";

/**
 * Result-object sözleşmesi + hata kodu: NO_PROFILE ayrı bir koddur çünkü
 * UI bunun için düz hata değil, /profile'a yönlendiren bir CTA gösterir.
 */
export type FindMatchesResult =
  | { ok: true; matches: JobMatch[]; skipped: number }
  | { ok: false; code: "NO_PROFILE" | "ERROR"; error: string };

export async function findMatches(): Promise<FindMatchesResult> {
  const userId = await requireUserId();

  try {
    const result = await findBestMatches(userId, { topK: 10 });
    return { ok: true, matches: result.matches, skipped: result.skipped };
  } catch (e) {
    if (e instanceof CandidateProfileMissingError) {
      return { ok: false, code: "NO_PROFILE", error: e.message };
    }
    if (
      e instanceof MatchEngineError ||
      e instanceof GeminiError ||
      e instanceof GeminiEmbeddingError ||
      e instanceof MissingApiKeyError
    ) {
      return { ok: false, code: "ERROR", error: e.message };
    }
    throw e;
  }
}

// ─── Discover: dış kaynaklardan gerçek ilan önerileri ────────────────────────

export type DiscoverJobsResult =
  | { ok: true; matches: DiscoveredMatch[]; skipped: number; poolSize: number }
  | { ok: false; code: "NO_PROFILE" | "ERROR"; error: string };

/** Panelden gelen filtreleri server tarafında yeniden doğrula (Zod). */
const discoveryFiltersSchema = z.object({
  source:   z.enum(["remotive", "jsearch"]),
  query:    z.string().max(120).optional(),
  location: z.string().max(120).optional(),
  workType: z.enum(["REMOTE", "HYBRID", "ON_SITE", "ANY"]).optional(),
});

export async function discoverJobs(
  rawFilters?: unknown,
): Promise<DiscoverJobsResult> {
  const userId = await requireUserId();

  let filters: DiscoveryFilters | undefined;
  if (rawFilters !== undefined) {
    const parsed = discoveryFiltersSchema.safeParse(rawFilters);
    if (!parsed.success) {
      return { ok: false, code: "ERROR", error: "Invalid discovery filters." };
    }
    filters = parsed.data;
  }

  try {
    const result = await discoverMatchingJobs(userId, filters);
    return { ok: true, ...result };
  } catch (e) {
    if (e instanceof CandidateProfileMissingError) {
      return { ok: false, code: "NO_PROFILE", error: e.message };
    }
    if (
      e instanceof DiscoveryError ||
      e instanceof MatchEngineError ||
      e instanceof GeminiError ||
      e instanceof MissingApiKeyError
    ) {
      return { ok: false, code: "ERROR", error: e.message };
    }
    throw e;
  }
}

// ─── Save: keşfedilen ilanı kullanıcının Job listesine al ────────────────────

const saveDiscoveredJobSchema = z.object({
  title:       z.string().min(1).max(200),
  company:     z.string().min(1).max(200),
  url:         z.url(),
  description: z.string().min(1),
  location:    z.string().max(200).nullable(),
  salary:      z.string().max(200).nullable(),
  workType:    z.enum(["REMOTE", "HYBRID", "ON_SITE"]).nullable(),
  source:      z.enum(["remotive", "jsearch"]),
});

/** DiscoverySource → Job.source insan-okur etiketi. */
const SOURCE_LABEL: Record<"remotive" | "jsearch", string> = {
  remotive: "Remotive (AI Discover)",
  jsearch:  "JSearch (AI Discover)",
};

export type SaveDiscoveredJobResult =
  | { ok: true; jobId: string; alreadySaved: boolean }
  | { ok: false; error: string };

/**
 * Keşfedilen ilanı WISHLIST'e kaydeder. createJob kullanılmaz çünkü o form
 * akışı için redirect eder; burada yerinde (in-place) kayıt gerekiyor.
 * Kayıt sonrası Faz 3 arka plan enrichment'ı (parse + embed) otomatik koşar —
 * ilan anında /matches "My Jobs" tarafında da eşleşebilir hale gelir.
 */
export async function saveDiscoveredJob(rawData: unknown): Promise<SaveDiscoveredJobResult> {
  const userId = await requireUserId();

  const parsed = saveDiscoveredJobSchema.safeParse(rawData);
  if (!parsed.success) {
    return { ok: false, error: "Invalid job data." };
  }
  const data = parsed.data;

  // Aynı ilan (URL) daha önce kaydedildiyse kopya üretme.
  const existing = await prisma.job.findFirst({
    where:  { userId, jobUrl: data.url },
    select: { id: true },
  });
  if (existing) {
    return { ok: true, jobId: existing.id, alreadySaved: true };
  }

  const job = await prisma.job.create({
    data: {
      userId,
      title:       data.title,
      company:     data.company,
      status:      "WISHLIST",
      // Kaynağın bildirdiği tip; bilinmiyorsa remote kaynaklardan gelen
      // ilanlar için makul varsayılan REMOTE.
      workType:    data.workType ?? "REMOTE",
      jobUrl:      data.url,
      location:    data.location,
      salary:      data.salary,
      source:      SOURCE_LABEL[data.source],
      description: data.description,
    },
  });

  scheduleJobEnrichment(job.id, userId, true);

  const t = await getTranslations("notifications");
  await createNotification(userId, {
    type:  "JOB_DISCOVERED",
    title: t("discoveredTitle", { title: job.title }),
    body:  t("discoveredBody", { company: job.company }),
    jobId: job.id,
  });

  revalidatePath("/jobs");
  revalidatePath("/dashboard");

  return { ok: true, jobId: job.id, alreadySaved: false };
}
