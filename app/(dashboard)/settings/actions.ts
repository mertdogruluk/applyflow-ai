"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { requireUserId } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseCv } from "@/lib/ai/cv-parser";
import { embedCandidateProfile } from "@/lib/ai/embeddings";

// ─── Update candidate profile from CV ────────────────────────────────────────

const cvInputSchema = z.object({
  cvText: z.string().min(1, "CV text is required."),
});

/**
 * Ham CV metnini analiz eder, CandidateProfile'ı upsert eder.
 * Embedding üretimi response sonrası arka planda çalışır (after) —
 * kullanıcı Gemini embedding çağrısını beklemez, hata olursa loglanır
 * ve bir sonraki eşleştirme isteğinde lazy olarak telafi edilir.
 *
 * parseCv hataları (CvTooShortError, GeminiError...) üst katmana fırlatılır;
 * UI orada anlamlı mesaj gösterir.
 */
export async function updateCandidateProfile(rawData: unknown) {
  const userId = await requireUserId();

  const parsed = cvInputSchema.safeParse(rawData);
  if (!parsed.success) {
    throw new Error("Invalid input: cvText is required.");
  }

  const analysis = await parseCv(parsed.data.cvText);

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

  revalidatePath("/settings");
  return analysis;
}
