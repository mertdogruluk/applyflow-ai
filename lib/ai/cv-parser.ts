// Aday CV'sini analiz eden saf service module.
//
// Stratejisi:
//  1. Anti-hallucination odaklı system instruction ile Gemini'ye gönderir
//  2. Çıktıyı strict Zod schema ile zorla doğrular (max sınırlar dahil)
//  3. Tekrar eden yetenekleri case-insensitive dedup eder
//
// Bu dosya bilinçli olarak "use server" değil — testable pure logic.
// Faz 2'de bir Server Action wrapper bu fonksiyonu çağıracak.

import { z } from "zod";

import { callGeminiJson, GeminiError } from "@/lib/ai/gemini";

// ─── Sabitler ────────────────────────────────────────────────────────────────

const MIN_CV_LENGTH = 100;
const MAX_CV_LENGTH = 30_000;

// ─── Zod Schema ──────────────────────────────────────────────────────────────

/**
 * LLM çıktısının strict şekli.
 *  - max sınırlar halüsinasyon patlamalarını yakalar (model "500 yetenek"
 *    dökerse parse fail eder, sessizce kabul edilmez).
 *  - years_of_experience üst sınırı 60 — saçma değerleri (örn. "200 yıl") yakalar.
 *  - decimal kabul edilir; CV "2.5 yıl" diyebilir.
 */
export const cvAnalysisSchema = z.object({
  core_skills:         z.array(z.string().min(1).max(60)).max(50),
  tools_and_tech:      z.array(z.string().min(1).max(40)).max(100),
  years_of_experience: z.number().min(0).max(60),
});

export type CvAnalysis = z.infer<typeof cvAnalysisSchema>;

// ─── Hata Sınıfları ──────────────────────────────────────────────────────────

export class CvTooShortError extends Error {
  constructor() {
    super(`CV text is too short to analyze (minimum ${MIN_CV_LENGTH} characters).`);
    this.name = "CvTooShortError";
  }
}

export class CvParserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CvParserError";
  }
}

// ─── Prompt Builder ──────────────────────────────────────────────────────────

/**
 * Anti-hallucination system instruction.
 *
 * Üç teknik:
 *  1. "LITERALLY present" vurgusu — yorum yapma sinyali
 *  2. Karşı-örnekler ("Software Engineer ≠ Java") — yaygın inference hatalarını engeller
 *  3. "Prefer omission over invention" — boş diziyi meşrulaştırır, modeli doldurmaya itmez
 */
function buildCvParserPrompt(cvText: string): string {
  return `You are a CV analysis system. Extract ONLY information LITERALLY present in the CV.

STRICT RULES:
1. Extract ONLY what is explicitly written. Never infer, guess, or assume.
2. Job titles do NOT imply skills. "Software Engineer" does not mean "Java".
3. Industries do NOT imply tools. "Fintech" does not mean "Kafka".
4. If years of experience are not stated, return 0. Never estimate.
5. Prefer omission over invention. Empty arrays are valid answers.

INPUT LANGUAGE:
- The CV may be in any language. You understand it regardless.
- Output skill and tool names VERBATIM as they appear in the CV
  (do not translate "React" or vice versa).

FIELD DEFINITIONS:
- core_skills: high-level competencies explicitly named in the CV
  (e.g., "Frontend Development", "System Design", "Technical Leadership").
  These are NOT specific tools.
- tools_and_tech: specific named tools, languages, frameworks, platforms
  (e.g., "React", "PostgreSQL", "AWS Lambda"). Verbatim from the CV.
- years_of_experience: total years of professional work experience.
  Sum role durations if the CV lists separate positions.
  Use 0 if unclear or unstated. Decimals allowed (e.g., 2.5).

OUTPUT:
Return ONLY a strict JSON object matching this exact shape
(no markdown, no commentary, no surrounding text):
{
  "core_skills": string[],
  "tools_and_tech": string[],
  "years_of_experience": number
}

CV TEXT:
${cvText}`;
}

// ─── Yardımcı ────────────────────────────────────────────────────────────────

/**
 * Case-insensitive dedup; ilk görülen kasayı korur ("React" + "react" → "React").
 */
function dedupCaseInsensitive(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const item = raw.trim();
    if (!item) continue;
    const key = item.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Verilen CV metnini Gemini ile analiz eder; structured + validated sonuç döner.
 *
 * @throws CvTooShortError    — Metin MIN_CV_LENGTH'in altında
 * @throws MissingApiKeyError — GEMINI_API_KEY env değişkeni yok (gemini.ts'den)
 * @throws GeminiError        — API hatası veya malformed JSON
 * @throws CvParserError      — Çıktı Zod schema'sıyla uyumsuz
 */
export async function parseCv(cvText: string): Promise<CvAnalysis> {
  const trimmed = cvText.trim();
  if (trimmed.length < MIN_CV_LENGTH) {
    throw new CvTooShortError();
  }

  const input  = trimmed.length > MAX_CV_LENGTH ? trimmed.slice(0, MAX_CV_LENGTH) : trimmed;
  const prompt = buildCvParserPrompt(input);
  const raw    = await callGeminiJson(prompt);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new GeminiError("AI returned malformed JSON. Please try again.");
  }

  const result = cvAnalysisSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".") || "<root>"}: ${i.message}`)
      .join("; ");
    throw new CvParserError(`AI response did not match the expected shape — ${issues}`);
  }

  return {
    core_skills:         dedupCaseInsensitive(result.data.core_skills),
    tools_and_tech:      dedupCaseInsensitive(result.data.tools_and_tech),
    years_of_experience: result.data.years_of_experience,
  };
}
