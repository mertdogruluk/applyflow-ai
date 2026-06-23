// pgvector tabanlı aday retrieval katmanı.
//
// Bir Job için (veya verilmiş bir query vektörü için) aynı kullanıcının
// projeleri arasından cosine similarity ile top-K en yakın olanları getirir.
// Bu katman LLM kullanmaz; sadece anlamsal yakınlık sıralaması yapar.
//
// Sonuçlar lib/matching/judge.ts katmanında LLM-as-a-Judge'a girdi olarak
// verilir. İki katmanlı RAG-benzeri mimari:
//   retrieve (ucuz, hızlı) → judge (pahalı, derin)

import { prisma } from "@/lib/prisma";

// ─── Sabitler ────────────────────────────────────────────────────────────────

/** lib/ai/embeddings.ts ile aynı boyut. Değişirse migration gerekir. */
const EMBEDDING_DIMENSIONS = 768;

export const DEFAULT_TOP_K = 5;
export const MAX_TOP_K     = 20;

// ─── Tipler ──────────────────────────────────────────────────────────────────

/**
 * Retrieval sonucu: proje meta verisi + cosine similarity (0-1, yüksek = yakın).
 * description ve techStack bir sonraki katmanda (judge prompt) kullanılır.
 */
export interface ProjectCandidate {
  id:          string;
  name:        string;
  description: string | null;
  techStack:   string[];
  /** 1 - cosine_distance. Genellikle 0-1 aralığında. */
  similarity:  number;
}

export interface RetrieveOptions {
  /** Döndürülecek top-K. 1..MAX_TOP_K aralığında. */
  topK?: number;
}

// ─── Hatalar ─────────────────────────────────────────────────────────────────

/**
 * Job veya Project'in embedding'i henüz üretilmemişse fırlatılır.
 * Orchestrator bunu yakalayıp lazy embed → retry yapabilir.
 */
export class MissingEmbeddingError extends Error {
  constructor(
    public readonly kind: "job" | "project",
    public readonly id: string,
  ) {
    super(`${kind} ${id} has no embedding yet. Generate it via embed${kind === "job" ? "Job" : "Project"} first.`);
    this.name = "MissingEmbeddingError";
  }
}

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

function validateTopK(value: number): number {
  if (!Number.isInteger(value) || value < 1 || value > MAX_TOP_K) {
    throw new Error(
      `topK must be an integer between 1 and ${MAX_TOP_K} (got ${value}).`,
    );
  }
  return value;
}

function toVectorLiteral(values: number[]): string {
  return `[${values.join(",")}]`;
}

// ─── Public: vektör → proje aday listesi ─────────────────────────────────────

/**
 * Verilen query vektörüne en yakın kullanıcı projelerini getirir.
 *  - Embedding'i olmayan projeler hariç tutulur.
 *  - Sıralama cosine distance ASC üzerinden (ivfflat index'ten faydalanır).
 *
 * @throws Error — queryVector boyutu hatalıysa veya topK geçersizse.
 */
export async function findSimilarProjectsByVector(
  userId: string,
  queryVector: number[],
  options: RetrieveOptions = {},
): Promise<ProjectCandidate[]> {
  if (queryVector.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Invalid query vector: expected ${EMBEDDING_DIMENSIONS} dims, got ${queryVector.length}.`,
    );
  }

  const topK    = validateTopK(options.topK ?? DEFAULT_TOP_K);
  const literal = toVectorLiteral(queryVector);

  // ORDER BY raw distance kullanıyoruz; ivfflat index bu sırada devreye girer.
  // SELECT'teki "similarity = 1 - distance" sadece dönüş değeri için.
  return prisma.$queryRaw<ProjectCandidate[]>`
    SELECT
      p."id",
      p."name",
      p."description",
      p."techStack",
      1 - (p."embedding" <=> ${literal}::vector) AS "similarity"
    FROM "Project" p
    WHERE p."userId"    = ${userId}
      AND p."embedding" IS NOT NULL
    ORDER BY p."embedding" <=> ${literal}::vector ASC
    LIMIT ${topK}
  `;
}

// ─── Public: Job → proje aday listesi ────────────────────────────────────────

/**
 * Belirtilen Job'un embedding'ine en yakın kullanıcı projelerini getirir.
 * Job vektörü hiç JS tarafına çekilmez — tek round-trip CROSS JOIN ile aranır.
 *
 * @throws Error — Job kullanıcıya ait değilse veya bulunamadıysa.
 * @throws MissingEmbeddingError — Job henüz embed edilmediyse.
 */
export async function findSimilarProjectsForJob(
  userId: string,
  jobId: string,
  options: RetrieveOptions = {},
): Promise<ProjectCandidate[]> {
  const topK = validateTopK(options.topK ?? DEFAULT_TOP_K);

  // Önce Job sahipliği + embedding varlığını doğrula. Tek satır, ucuz.
  const jobCheck = await prisma.$queryRaw<Array<{ has_embedding: boolean }>>`
    SELECT ("embedding" IS NOT NULL) AS has_embedding
    FROM "Job"
    WHERE "id"     = ${jobId}
      AND "userId" = ${userId}
  `;

  if (jobCheck.length === 0) {
    throw new Error("Job not found or you don't have access.");
  }
  if (!jobCheck[0].has_embedding) {
    throw new MissingEmbeddingError("job", jobId);
  }

  // CROSS JOIN ile job vektörünü subquery'den çekiyoruz; tek sorgu, tek round-trip.
  // Subquery WHERE "id" = ... önceden doğrulandı; userId guard tekrar burada da yok
  // çünkü id zaten unique ve sahipliği yukarıda kanıtlandı.
  return prisma.$queryRaw<ProjectCandidate[]>`
    SELECT
      p."id",
      p."name",
      p."description",
      p."techStack",
      1 - (p."embedding" <=> j."embedding") AS "similarity"
    FROM "Project" p
    CROSS JOIN (
      SELECT "embedding"
      FROM "Job"
      WHERE "id" = ${jobId}
    ) AS j
    WHERE p."userId"    = ${userId}
      AND p."embedding" IS NOT NULL
    ORDER BY p."embedding" <=> j."embedding" ASC
    LIMIT ${topK}
  `;
}
