// İş ilanı metnini analiz eden saf service module.
//
// CV parser (lib/ai/cv-parser.ts) ile simetrik tasarlandı; aynı hata yönetimi,
// aynı reuse deseni. Buradaki ek zekâ: becerileri "kesin gereken" (must_haves)
// ve "olursa iyi" (nice_to_haves) olarak gereksinim seviyesine göre ayırmak.
//
// Strict Extraction: model yalnızca ilanda LİTERAL geçen becerileri çıkarır,
// asla uydurmaz veya çıkarımda bulunmaz.

import { z } from "zod";

import { callGeminiJson, GeminiError } from "@/lib/ai/gemini";

// ─── Sabitler ────────────────────────────────────────────────────────────────

const MIN_JOB_LENGTH = 80;
const MAX_JOB_LENGTH = 30_000;

// ─── Zod Schema ──────────────────────────────────────────────────────────────

/**
 * LLM çıktısının strict şekli.
 *  - max sınırlar halüsinasyon patlamalarını yakalar (model "60 must-have"
 *    dökerse parse fail eder).
 *  - String max(80): "Experience with distributed systems at scale" gibi uzun
 *    ama meşru gereksinim ifadelerine izin verir, cümleye dönüşmesini engeller.
 */
export const jobAnalysisSchema = z.object({
  must_haves:    z.array(z.string().min(1).max(80)).max(50),
  nice_to_haves: z.array(z.string().min(1).max(80)).max(50),
  // Açıkça istenen minimum deneyim yılı. Belirtilmemişse null (eşleştirmede
  // "bu boyutta filtre uygulama" anlamına gelir — 0'dan, yani "giriş seviyesi"den
  // kasıtlı olarak ayrılır).
  min_years_experience: z.number().min(0).max(60).nullable(),
});

export type JobAnalysis = z.infer<typeof jobAnalysisSchema>;

// ─── Hata Sınıfları ──────────────────────────────────────────────────────────

export class JobTooShortError extends Error {
  constructor() {
    super(`Job text is too short to analyze (minimum ${MIN_JOB_LENGTH} characters).`);
    this.name = "JobTooShortError";
  }
}

export class JobParserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "JobParserError";
  }
}

// ─── Prompt Builder ──────────────────────────────────────────────────────────

/**
 * Strict Extraction system instruction.
 *
 * İki sorumluluk:
 *  1. Anti-hallucination — yalnızca literal yazılı becerileri çıkar
 *  2. Sınıflandırma — must-have vs nice-to-have, dil sinyallerine göre
 */
function buildJobParserPrompt(jobText: string): string {
  return `You are a job-posting analysis system. Extract the required and optional
skills EXACTLY as written. Perform STRICT EXTRACTION ONLY.

STRICT RULES:
1. Extract ONLY skills/technologies LITERALLY mentioned in the posting.
   Never infer, guess, or add related technologies.
2. A seniority level does NOT imply specific skills. "Senior role" does not
   mean "10 years experience" unless explicitly stated.
3. A named technology does NOT imply its ecosystem. "React" does not mean
   "Redux" or "Next.js" unless they are written too.
4. Prefer omission over invention. Empty arrays are valid answers.

CLASSIFICATION (must_haves vs nice_to_haves):
- must_haves: skills under "Requirements", "Qualifications", "You must have",
  or stated with mandatory language ("required", "must", "essential"), OR
  listed plainly with no softening language.
- nice_to_haves: skills stated with softening language ("preferred", "a plus",
  "bonus", "nice to have", "ideally", "would be great", "familiarity with").
- If a skill is ambiguous, place it in must_haves (stronger default).
- A skill must appear in AT MOST ONE array, never both.

EXPERIENCE REQUIREMENT (min_years_experience):
- Extract the MINIMUM years of professional experience EXPLICITLY required.
- "5+ years" → 5. "at least 3 years" → 3. A range like "3-5 years" → 3 (the lower bound).
- "Entry level" or "new grads welcome" with no number → 0.
- If no experience requirement is stated at all → null.
- NEVER infer a number from a seniority label. "Senior" alone does NOT mean
  any specific number — return null unless an explicit number is written.

INPUT LANGUAGE:
- The posting may be in any language. Output skill names VERBATIM as written
  (do not translate "React", "Docker", etc.).

OUTPUT:
Return ONLY a strict JSON object matching this exact shape
(no markdown, no commentary, no surrounding text):
{
  "must_haves": string[],
  "nice_to_haves": string[],
  "min_years_experience": number | null
}

JOB POSTING:
${jobText}`;
}

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

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

/**
 * Bir beceri her iki listede de varsa must_haves kazanır (daha güçlü sinyal);
 * nice_to_haves'ten düşülür.
 */
function removeCrossDuplicates(mustHaves: string[], niceToHaves: string[]): string[] {
  const mustKeys = new Set(mustHaves.map((s) => s.toLowerCase()));
  return niceToHaves.filter((s) => !mustKeys.has(s.toLowerCase()));
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Verilen iş ilanı metnini Gemini ile analiz eder; structured + validated sonuç döner.
 *
 * @throws JobTooShortError   — Metin MIN_JOB_LENGTH'in altında
 * @throws MissingApiKeyError — GEMINI_API_KEY env değişkeni yok (gemini.ts'den)
 * @throws GeminiError        — API hatası veya malformed JSON
 * @throws JobParserError     — Çıktı Zod schema'sıyla uyumsuz
 */
export async function parseJob(jobText: string): Promise<JobAnalysis> {
  const trimmed = jobText.trim();
  if (trimmed.length < MIN_JOB_LENGTH) {
    throw new JobTooShortError();
  }

  const input  = trimmed.length > MAX_JOB_LENGTH ? trimmed.slice(0, MAX_JOB_LENGTH) : trimmed;
  const prompt = buildJobParserPrompt(input);
  const raw    = await callGeminiJson(prompt);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new GeminiError("AI returned malformed JSON. Please try again.");
  }

  const result = jobAnalysisSchema.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".") || "<root>"}: ${i.message}`)
      .join("; ");
    throw new JobParserError(`AI response did not match the expected shape — ${issues}`);
  }

  const mustHaves    = dedupCaseInsensitive(result.data.must_haves);
  const niceToHaves  = removeCrossDuplicates(mustHaves, dedupCaseInsensitive(result.data.nice_to_haves));

  return {
    must_haves:           mustHaves,
    nice_to_haves:        niceToHaves,
    min_years_experience: result.data.min_years_experience,
  };
}
