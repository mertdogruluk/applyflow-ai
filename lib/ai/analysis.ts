import { z } from "zod";
import { buildAnalysisPrompt } from "@/lib/ai/prompts";
import { callGeminiJson, GeminiError } from "@/lib/ai/gemini";

// ─── Input ───────────────────────────────────────────────────────────────────

interface AnalysisInput {
  title:       string;
  company:     string;
  description: string | null;
  projects: {
    name: string;
    description: string | null;
    techStack: string[];
  }[];
}

// ─── Output schema ───────────────────────────────────────────────────────────

const analysisResultSchema = z.object({
  matchScore: z.number().min(0).max(100),
  summary:    z.string().default(""),
  strengths:            z.array(z.string()).default([]),
  missingKeywords:      z.array(z.string()).default([]),
  recommendedCvBullets: z.array(z.string()).default([]),
  coverLetterDraft:     z.string().default(""),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;

// ─── Orchestrator ────────────────────────────────────────────────────────────

/**
 * Job + bağlı projeler verisini Gemini'ye gönderir, parse edilmiş AnalysisResult döner.
 * Hatalar üst katmana fırlatılır — UI orada anlamlı mesaj gösterir.
 */
export async function runAnalysis(input: AnalysisInput): Promise<AnalysisResult> {
  const prompt = buildAnalysisPrompt(input);
  const raw = await callGeminiJson(prompt);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new GeminiError("AI returned malformed JSON. Please try again.");
  }

  const result = analysisResultSchema.safeParse(parsed);
  if (!result.success) {
    throw new GeminiError("AI response did not match the expected shape.");
  }

  // matchScore'u her ihtimale karşı clamp edelim
  return {
    ...result.data,
    matchScore: Math.max(0, Math.min(100, Math.round(result.data.matchScore))),
  };
}
