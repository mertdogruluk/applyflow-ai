// Keşif Motoru (Discovery Engine) — dış kaynaklardan gelen GERÇEK ilanları
// aday profiline göre puanlar. İki aşamalı desen match-engine ile paralel:
//
//   Aşama 1 (ücretsiz ön eleme): keyword-overlap — profildeki araç/beceri
//     adlarının ilan metninde geçme sayısı. pgvector kullanılamaz çünkü bu
//     ilanlar DB'de yok; overlap, dış veri için yeterli ve bedava bir filtre.
//   Aşama 2 (hakem): Faz 4'ün adalet kurallı LLM-as-a-Judge prompt'u —
//     tek batch çağrı, overqualified aday asla cezalanmaz.
//
// Halüsinasyon imkansız: ilanlar API'den gelir, LLM sadece PUANLAR.

import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { callGeminiJson, GeminiError } from "@/lib/ai/gemini";
import { CandidateProfileMissingError, MatchEngineError } from "@/lib/ai/match-engine";
import { fetchRemotiveJobs } from "@/lib/discovery/remotive";
import { fetchJoobleJobs } from "@/lib/discovery/jooble";
import type {
  DiscoveredJob,
  DiscoveredMatch,
  DiscoveryFilters,
} from "@/lib/discovery/types";

// ─── Sabitler ────────────────────────────────────────────────────────────────

/** Hakeme gönderilecek ilan sayısı (tek batch çağrının boyutu). */
const JUDGE_POOL_SIZE = 10;

/** Judge prompt'unda ilan başına açıklama üst sınırı (token bütçesi). */
const JUDGE_DESC_CHARS = 3_500;

/** Ön elemede en az 1 ortak terim şartı — tamamen alakasız ilan hakeme gitmez. */
const MIN_KEYWORD_OVERLAP = 1;

// ─── Aşama 1: keyword-overlap ön eleme ───────────────────────────────────────

interface ScoredCandidate {
  job:     DiscoveredJob;
  overlap: number;
}

function keywordPrefilter(
  jobs: DiscoveredJob[],
  terms: string[],
): ScoredCandidate[] {
  const needles = [...new Set(terms.map((t) => t.trim().toLowerCase()).filter(Boolean))];

  const scored: ScoredCandidate[] = [];
  const seen = new Set<string>();

  for (const job of jobs) {
    if (seen.has(job.externalId)) continue; // kaynak dedupe
    seen.add(job.externalId);

    const haystack = [
      job.title,
      job.tags.join(" "),
      job.description.slice(0, 4_000),
    ]
      .join(" ")
      .toLowerCase();

    const overlap = needles.reduce(
      (acc, needle) => (haystack.includes(needle) ? acc + 1 : acc),
      0,
    );

    if (overlap >= MIN_KEYWORD_OVERLAP) scored.push({ job, overlap });
  }

  return scored
    .sort((a, b) => b.overlap - a.overlap)
    .slice(0, JUDGE_POOL_SIZE);
}

// ─── Aşama 2: LLM-as-a-Judge ─────────────────────────────────────────────────

const judgeVerdictSchema = z.object({
  results: z
    .array(
      z.object({
        jobId:     z.string().min(1),
        score:     z.number().min(0).max(100),
        reasoning: z.string().min(1).max(400),
      }),
    )
    .max(JUDGE_POOL_SIZE),
});

interface CandidateSnapshot {
  coreSkills:        string[];
  toolsTech:         string[];
  yearsOfExperience: number;
}

/**
 * match-engine'in adalet kuralları birebir — tek fark: ilanlar DB'den değil
 * dış API'den geldiği için structured must_haves yok, hakem ham ilan
 * metninden gereksinimleri kendisi okur.
 */
function buildDiscoveryJudgePrompt(
  candidate: CandidateSnapshot,
  candidates: ScoredCandidate[],
): string {
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
    candidates.map(({ job }) => ({
      jobId:       job.externalId,
      title:       job.title,
      company:     job.company,
      description: job.description.slice(0, JUDGE_DESC_CHARS),
    })),
    null,
    2,
  );

  return `You are an impartial technical recruiter acting as a judge.
For EACH job posting below, score how well the candidate MATCHES it (0-100).

SCORING RULES:
1. Read the posting and identify its MANDATORY requirements yourself.
   The score means: what percentage of those must-have requirements does
   the candidate's skill set (core_skills + tools_and_tech) cover?
2. NEVER deduct points for extra skills the job does not ask for.
   An overqualified candidate is NOT a worse match. Extra knowledge is
   neutral or positive, never negative.
3. Optional/preferred requirements add a small bonus when covered (at most
   +10 above must-have coverage). Missing them is NEVER a penalty.
4. Experience: if the posting states no year requirement, ignore experience.
   Meeting or exceeding a stated requirement fully satisfies it — exceeding
   is NOT a negative. Falling short reduces the score proportionally.
5. Judge ONLY from the data provided. Do not assume skills that are not
   listed. Treat equivalent names as the same skill (e.g. "PostgreSQL"
   matches "Postgres").
6. reasoning must be EXACTLY ONE sentence explaining the score.

CANDIDATE:
${candidateJson}

JOB POSTINGS:
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

// ─── Orkestrasyon ────────────────────────────────────────────────────────────

export interface DiscoveryResult {
  matches: DiscoveredMatch[];
  /** Ön elemeyi geçip hakem yanıtında yer almayan ilan sayısı. */
  skipped: number;
  /** Kaynaktan çekilen toplam ilan (UI bilgilendirmesi için). */
  poolSize: number;
}

/**
 * Dış kaynaklardan gerçek ilanları çekip aday profiline göre puanlar.
 * DB'ye HİÇBİR ŞEY yazmaz — kullanıcı "Save" derse ilan Job'a dönüşür.
 *
 * Filtreler: source kaynağı seçer (remotive = global remote, jooble =
 * Türkiye + yerel), workType çekilen havuzu daraltır, query/location
 * Jooble sorgusuna geçer. Query boşsa profildeki araçlardan türetilir.
 *
 * @throws CandidateProfileMissingError — profil hiç yoksa
 * @throws DiscoveryError — kaynak API ulaşılamaz/bozuksa/yapılandırılmamışsa
 * @throws GeminiError / MatchEngineError — hakem katmanından
 */
export async function discoverMatchingJobs(
  userId: string,
  filters?: DiscoveryFilters,
): Promise<DiscoveryResult> {
  const profile = await prisma.candidateProfile.findUnique({
    where:  { userId },
    select: { coreSkills: true, toolsTech: true, yearsOfExperience: true },
  });

  if (!profile) throw new CandidateProfileMissingError();

  // ── Aşama 0: gerçek ilanları çek (kaynak seçimi) ──────────────────────────
  const source = filters?.source ?? "remotive";
  const workType = filters?.workType ?? "ANY";

  let pool: DiscoveredJob[];
  if (source === "jooble") {
    // Jooble keywords ister — kullanıcı vermezse profildeki en güçlü araçlardan üret.
    const query =
      filters?.query?.trim() ||
      profile.toolsTech.slice(0, 2).join(" ") ||
      profile.coreSkills[0] ||
      "software developer";
    pool = await fetchJoobleJobs({
      query,
      location:   filters?.location?.trim() || undefined,
      remoteOnly: workType === "REMOTE",
    });
  } else {
    pool = await fetchRemotiveJobs();
  }

  // Çalışma tipi filtresi: kaynak tipi bildirmiyorsa (null) ilan elenmez.
  const filteredPool =
    workType === "ANY"
      ? pool
      : pool.filter((j) => j.workType === null || j.workType === workType);

  // ── Aşama 1: keyword ön eleme ─────────────────────────────────────────────
  const terms = [...profile.toolsTech, ...profile.coreSkills];
  const shortlist = keywordPrefilter(filteredPool, terms);

  if (shortlist.length === 0) {
    return { matches: [], skipped: 0, poolSize: filteredPool.length };
  }

  // ── Aşama 2: hakem (tek batch çağrı) ──────────────────────────────────────
  const prompt = buildDiscoveryJudgePrompt(profile, shortlist);
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

  const verdictById = new Map(verdict.data.results.map((r) => [r.jobId, r]));

  const matches: DiscoveredMatch[] = [];
  let skipped = 0;

  for (const { job } of shortlist) {
    const v = verdictById.get(job.externalId);
    if (!v) {
      skipped++;
      console.warn(`[discovery] judge omitted job ${job.externalId} ("${job.title}")`);
      continue;
    }
    matches.push({
      ...job,
      fitScore:  Math.max(0, Math.min(100, Math.round(v.score))),
      reasoning: v.reasoning,
    });
  }

  matches.sort((a, b) => b.fitScore - a.fitScore);

  return { matches, skipped, poolSize: filteredPool.length };
}
