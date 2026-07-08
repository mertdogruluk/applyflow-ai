"use server";

import { revalidatePath } from "next/cache";
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
import type { DiscoveredMatch } from "@/lib/discovery/types";

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

export async function discoverJobs(): Promise<DiscoverJobsResult> {
  const userId = await requireUserId();

  try {
    const result = await discoverMatchingJobs(userId);
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
});

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
      workType:    "REMOTE", // Remotive = remote ilan kaynağı
      jobUrl:      data.url,
      location:    data.location,
      salary:      data.salary,
      source:      "Remotive (AI Discover)",
      description: data.description,
    },
  });

  scheduleJobEnrichment(job.id, userId, true);

  revalidatePath("/jobs");
  revalidatePath("/dashboard");

  return { ok: true, jobId: job.id, alreadySaved: false };
}
