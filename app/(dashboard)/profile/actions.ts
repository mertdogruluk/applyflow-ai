"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseCv, CvTooShortError, CvParserError, type CvAnalysis } from "@/lib/ai/cv-parser";
import { GeminiError, MissingApiKeyError } from "@/lib/ai/gemini";
import { embedCandidateProfile } from "@/lib/ai/embeddings";

// ─── Update candidate profile from CV ────────────────────────────────────────

const cvInputSchema = z.object({
  cvText: z.string().min(1, "CV text is required."),
});

/**
 * Discriminated union dönüyoruz (throw değil): Server Action'da fırlatılan
 * hata mesajları production'da Next.js tarafından maskelenir — "CV çok kısa"
 * gibi kullanıcıya gösterilmesi gereken mesajlar kaybolurdu.
 */
export type UpdateProfileResult =
  | { ok: true; analysis: CvAnalysis }
  | { ok: false; error: string };

/**
 * Ham CV metnini analiz eder, CandidateProfile'ı upsert eder.
 * Embedding üretimi response sonrası arka planda çalışır (after) —
 * kullanıcı Gemini embedding çağrısını beklemez; hata olursa loglanır
 * ve bir sonraki eşleştirme isteğinde lazy backfill ile telafi edilir.
 */
export async function updateCandidateProfile(rawData: unknown): Promise<UpdateProfileResult> {
  const userId = await requireUserId();

  const parsed = cvInputSchema.safeParse(rawData);
  if (!parsed.success) {
    return { ok: false, error: "CV text is required." };
  }

  let analysis: CvAnalysis;
  try {
    analysis = await parseCv(parsed.data.cvText);
  } catch (e) {
    // Bilinen, kullanıcıya gösterilebilir hatalar → mesajı aynen ilet
    if (
      e instanceof CvTooShortError ||
      e instanceof CvParserError ||
      e instanceof GeminiError ||
      e instanceof MissingApiKeyError
    ) {
      return { ok: false, error: e.message };
    }
    throw e; // bilinmeyen hata — maskelenerek yukarı çıksın
  }

  await prisma.candidateProfile.upsert({
    where:  { userId },
    create: {
      userId,
      cvText:            parsed.data.cvText,
      coreSkills:        analysis.core_skills,
      toolsTech:         analysis.tools_and_tech,
      yearsOfExperience: analysis.years_of_experience,
    },
    update: {
      cvText:            parsed.data.cvText,
      coreSkills:        analysis.core_skills,
      toolsTech:         analysis.tools_and_tech,
      yearsOfExperience: analysis.years_of_experience,
    },
  });

  after(async () => {
    try {
      await embedCandidateProfile(userId);
    } catch (e) {
      console.error(`[profile] background embedding failed for ${userId}:`, e);
    }
  });

  revalidatePath("/profile");
  return { ok: true, analysis };
}
