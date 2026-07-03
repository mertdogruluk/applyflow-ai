// Eşleştirme Motoru (Matchmaking Engine) — İki Aşamalı (Two-Stage) mimari.
//
//   Adım A (Hızlı Getirme): pgvector cosine similarity ($queryRaw + <=>) ile
//     adayın profiline en yakın iş ilanlarını getirir. Ucuz ve hızlı — LLM yok.
//   Adım B (Hakem Yapay Zeka): Getirilen ilanları TEK bir LLM çağrısında
//     yargılar: "aday, ilanın zorunlu ihtiyaçlarını % kaç karşılıyor?"
//
// Adalet ilkesi: adayın ilanda istenmeyen EKSTRA becerileri asla puan
// kırdırmaz (overqualified ≠ kötü eşleşme). Cosine benzerliği simetriktir ve
// fazla bilgiyi "uzaklık" olarak görür — hakem aşaması tam da bu haksızlığı
// düzeltmek için var.
//
// Not: ApplyFlow AI'da yön "1 aday → N ilan"dır (kullanıcı kendi ilanlarını
// eşleştirir). Recruiter senaryosundaki "1 ilan → N aday" yönünün tersi;
// mimari aynı, sorgu yönü farklı.

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { callGeminiJson, GeminiError } from "@/lib/ai/gemini";
import { embedCandidateProfile } from "@/lib/ai/embeddings";

// ─── Sabitler ────────────────────────────────────────────────────────────────

export const DEFAULT_MATCH_TOP_K = 10;
export const MAX_MATCH_TOP_K     = 20;

// ─── Tipler ──────────────────────────────────────────────────────────────────

/** Adım A çıktısı: ilan meta verisi + ham cosine similarity (0-1). */
interface RetrievedJob {
  id:                 string;
  title:              string;
  company:            string;
  mustHaves:          string[];
  niceToHaves:        string[];
  minYearsExperience: number | null;
  similarity:         number;
}

/** Motorun nihai çıktısındaki tek eşleşme. */
export interface JobMatch {
  jobId:      string;
  title:      string;
  company:    string;
  /** Adım A: vektörel yakınlık (0-1). Debug + ikincil sıralama. */
  similarity: number;
  /** Adım B: hakem skoru (0-100). Birincil sıralama anahtarı. */
  fitScore:   number;
  /** Hakemin tek cümlelik gerekçesi — kullanıcıya gösterilir. */
  reasoning:  string;
}

export interface MatchEngineResult {
  matches: JobMatch[];
  /** Retrieval'dan gelip hakem yanıtında yer almayan ilan sayısı (loglanır). */
  skipped: number;
}

export interface MatchOptions {
  /** Adım A'da getirilecek ilan sayısı. 1..MAX_MATCH_TOP_K. */
  topK?: number;
}

// ─── Hatalar ─────────────────────────────────────────────────────────────────

export class CandidateProfileMissingError extends Error {
  constructor() {
    super("Candidate profile not found. Analyze a CV first to enable matching.");
    this.name = "CandidateProfileMissingError";
  }
}

export class MatchEngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MatchEngineError";
  }
}

// ─── Hakem çıktısı: Zod schema ───────────────────────────────────────────────

const judgeVerdictSchema = z.object({
  results: z
    .array(
      z.object({
        jobId:     z.string().min(1),
        score:     z.number().min(0).max(100),
        reasoning: z.string().min(1).max(400),
      }),
    )
    .max(MAX_MATCH_TOP_K),
});

// ─── Adım B: Hakem prompt'u ──────────────────────────────────────────────────

interface CandidateSnapshot {
  coreSkills:        string[];
  toolsTech:         string[];
  yearsOfExperience: number;
}

/**
 * LLM-as-a-Judge prompt'u. Skorun tek tanımı: adayın becerileri ilanın
 * ZORUNLU ihtiyaçlarını yüzde kaç karşılıyor. Ekstra bilgi asla ceza değil.
 * Cosine similarity bilinçli olarak prompt'a KONMAZ — retrieval metadata'sı
 * hakemi çıpalamasın, iki aşama bağımsız sinyal üretsin.
 */
function buildJudgePrompt(candidate: CandidateSnapshot, jobs: RetrievedJob[]): string {
  const candidateJson = JSON.stringify(
    {
      core_skills:         candidate.coreSkills,
      tools_and_tech:      candidate.toolsTech,
      years_of_experience: candidate.yearsOfExperience,
    },
    null,
    2,
  );

  const jobsJson = JSON.stringify(
    jobs.map((j) => ({
      jobId:                j.id,
      title:                j.title,
      company:              j.company,
      must_haves:           j.mustHaves,
      nice_to_haves:        j.niceToHaves,
      min_years_experience: j.minYearsExperience,
    })),
    null,
    2,
  );

  return `You are an impartial technical recruiter acting as a judge.
For EACH job below, score how well the candidate MATCHES it (0-100).

SCORING RULES:
1. The score means: what percentage of the job's must_haves does the
   candidate's skill set (core_skills + tools_and_tech) cover?
2. NEVER deduct points for extra skills the job does not ask for.
   An overqualified candidate is NOT a worse match. Extra knowledge is
   neutral or positive, never negative.
3. Covered nice_to_haves add a small bonus (at most +10 above the
   must-have coverage). Missing nice_to_haves are NEVER a penalty.
4. Experience: if min_years_experience is null, ignore experience entirely.
   If the candidate meets or exceeds it, it is fully satisfied — exceeding
   it is NOT a negative. If the candidate falls short, reduce the score
   proportionally.
5. Judge ONLY from the data provided. Do not assume skills that are not
   listed. Treat equivalent names as the same skill (e.g. "PostgreSQL"
   matches "Postgres").
6. reasoning must be EXACTLY ONE sentence explaining the score.

CANDIDATE:
${candidateJson}

JOBS:
${jobsJson}

OUTPUT:
Return ONLY a strict JSON object matching this exact shape
(no markdown, no commentary). Include EVERY job exactly once:
{
  "results": [
    { "jobId": string, "score": number, "reasoning": string }
  ]
}`;
}

// ─── Adım A: Hızlı Getirme (pgvector cosine) ─────────────────────────────────

function validateTopK(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > MAX_MATCH_TOP_K) {
    throw new MatchEngineError(
      `topK must be an integer between 1 and ${MAX_MATCH_TOP_K} (got ${value}).`,
    );
  }
  return value;
}

/**
 * Adayın embedding'ine en yakın, kullanıcıya ait ilanları getirir.
 * Aday vektörü JS tarafına hiç çekilmez — tek round-trip CROSS JOIN.
 * ORDER BY ham distance üzerinden çalışır ki ivfflat index devreye girsin.
 */
async function retrieveSimilarJobs(userId: string, topK: number): Promise<RetrievedJob[]> {
  return prisma.$queryRaw<RetrievedJob[]>`
    SELECT
      j."id",
      j."title",
      j."company",
      j."mustHaves",
      j."niceToHaves",
      j."minYearsExperience",
      1 - (j."embedding" <=> c."embedding") AS "similarity"
    FROM "Job" j
    CROSS JOIN (
      SELECT "embedding"
      FROM "CandidateProfile"
      WHERE "userId" = ${userId}
    ) AS c
    WHERE j."userId"    = ${userId}
      AND j."embedding" IS NOT NULL
    ORDER BY j."embedding" <=> c."embedding" ASC
    LIMIT ${topK}
  `;
}

// ─── Orkestrasyon ────────────────────────────────────────────────────────────

/**
 * İki aşamalı eşleştirme motorunun tek giriş noktası.
 *
 *  1. Aday profilini doğrular; embedding yoksa lazy backfill dener.
 *  2. Adım A: cosine similarity ile top-K ilan getirir.
 *  3. Adım B: ilanları tek LLM çağrısında yargılatır (batch).
 *  4. Sonuçları fitScore DESC (eşitlikte similarity DESC) sıralar.
 *
 * @throws CandidateProfileMissingError — profil hiç yoksa
 * @throws MissingApiKeyError / GeminiError — LLM katmanından
 * @throws MatchEngineError — hakem çıktısı şemaya uymazsa
 */
export async function findBestMatches(
  userId: string,
  options: MatchOptions = {},
): Promise<MatchEngineResult> {
  const topK = validateTopK(options.topK ?? DEFAULT_MATCH_TOP_K);

  // ── Aday profili + embedding hazırlığı ────────────────────────────────────
  const profile = await prisma.candidateProfile.findUnique({
    where:  { userId },
    select: {
      coreSkills:        true,
      toolsTech:         true,
      yearsOfExperience: true,
      embeddedAt:        true,
    },
  });

  if (!profile) throw new CandidateProfileMissingError();

  // Embedding üretilmemişse lazy backfill — updateCandidateProfile'ın arka
  // plan embed'i başarısız olduysa burada telafi edilir.
  if (!profile.embeddedAt) {
    await embedCandidateProfile(userId, { force: true });
  }

  // ── Adım A: Hızlı Getirme ─────────────────────────────────────────────────
  const retrieved = await retrieveSimilarJobs(userId, topK);

  // Embedding'li ilan yoksa LLM maliyetine hiç girme.
  if (retrieved.length === 0) {
    return { matches: [], skipped: 0 };
  }

  // ── Adım B: Hakem Yapay Zeka ──────────────────────────────────────────────
  const prompt = buildJudgePrompt(profile, retrieved);
  const raw    = await callGeminiJson(prompt);

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new GeminiError("AI returned malformed JSON. Please try again.");
  }

  const verdict = judgeVerdictSchema.safeParse(parsed);
  if (!verdict.success) {
    const issues = verdict.error.issues
      .map((i) => `${i.path.join(".") || "<root>"}: ${i.message}`)
      .join("; ");
    throw new MatchEngineError(`Judge response did not match the expected shape — ${issues}`);
  }

  // ── Birleştirme: retrieval + hakem kararları ──────────────────────────────
  // Hakemin uydurduğu jobId'ler doğal olarak elenir (map'te bulunamaz);
  // hakemin atladığı ilanlar 'skipped' olarak raporlanır.
  const verdictByJobId = new Map(verdict.data.results.map((r) => [r.jobId, r]));

  const matches: JobMatch[] = [];
  let skipped = 0;

  for (const job of retrieved) {
    const v = verdictByJobId.get(job.id);
    if (!v) {
      skipped++;
      console.warn(`[match-engine] judge omitted job ${job.id} ("${job.title}")`);
      continue;
    }
    matches.push({
      jobId:      job.id,
      title:      job.title,
      company:    job.company,
      similarity: job.similarity,
      fitScore:   Math.max(0, Math.min(100, Math.round(v.score))),
      reasoning:  v.reasoning,
    });
  }

  matches.sort((a, b) => b.fitScore - a.fitScore || b.similarity - a.similarity);

  return { matches, skipped };
}
