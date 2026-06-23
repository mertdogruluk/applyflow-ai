// Gemini text-embedding-004 ile vektör üretimi ve pgvector kolonlarına yazım.
// Job ve Project kayıtlarının "anlamsal parmak izini" çıkarır; bu vektörler
// lib/matching/retrieve.ts içinde cosine similarity ile aday eşleştirmede
// kullanılır.

import { prisma } from "@/lib/prisma";
import { MissingApiKeyError } from "@/lib/ai/gemini";

// ─── Sabitler ────────────────────────────────────────────────────────────────

// gemini-embedding-001 = Google'ın aktif production embedding modeli.
// Varsayılan çıktı 3072 boyuttur; outputDimensionality ile 768'e indiriyoruz.
const GEMINI_EMBEDDING_MODEL = "gemini-embedding-001";
const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

/** Schema'daki vector(768) ile birebir eşleşmek zorunda. */
const EMBEDDING_DIMENSIONS = 768;

/** text-embedding-004 ≈ 2048 token; ortalama 4 char/token → güvenli üst sınır. */
const MAX_INPUT_CHARS = 8_000;

/** Bu eşiğin altındaki metin için anlamlı embedding üretilmez. */
const MIN_INPUT_CHARS = 10;

const TRANSIENT_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 800;

// ─── Tipler ──────────────────────────────────────────────────────────────────

/**
 * Gemini taskType — retrieval kalitesini iyileştirir. Saklanan içerik için
 * DOCUMENT, arama sorgusu için QUERY kullanılır. İkisinin embedding uzayında
 * birbirine yakın çıkması Google tarafında optimize edilmiştir.
 */
export type EmbeddingTaskType =
  | "RETRIEVAL_DOCUMENT"
  | "RETRIEVAL_QUERY"
  | "SEMANTIC_SIMILARITY"
  | "CLASSIFICATION"
  | "CLUSTERING";

interface GeminiEmbeddingResponse {
  embedding?: { values?: number[] };
  error?: { message?: string; status?: string };
}

// ─── Hatalar ─────────────────────────────────────────────────────────────────

export class GeminiEmbeddingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiEmbeddingError";
  }
}

export class EmbeddingTooShortError extends Error {
  constructor() {
    super(
      `Text is too short to produce a meaningful embedding (min ${MIN_INPUT_CHARS} chars).`,
    );
    this.name = "EmbeddingTooShortError";
  }
}

// ─── Yardımcılar ─────────────────────────────────────────────────────────────

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * pgvector literal formatı: '[0.1,0.2,...]'.
 * $executeRaw template ile birlikte `${literal}::vector` olarak cast edilir.
 */
function toVectorLiteral(values: number[]): string {
  return `[${values.join(",")}]`;
}

function truncate(text: string): string {
  return text.length > MAX_INPUT_CHARS ? text.slice(0, MAX_INPUT_CHARS) : text;
}

/**
 * Kayıt embedding'i bayat mı?
 * - Hiç üretilmemişse: bayat
 * - Kayıt son embed'den sonra güncellendiyse: bayat
 */
export function isEmbeddingStale(record: {
  updatedAt: Date;
  embeddedAt: Date | null;
}): boolean {
  if (!record.embeddedAt) return true;
  return record.updatedAt.getTime() > record.embeddedAt.getTime();
}

function formatUserMessage(status: number | null, raw: string): string {
  if (status === 503) {
    return "Gemini embedding is temporarily overloaded. Please try again.";
  }
  if (status === 429) {
    return "Gemini embedding quota reached for now. Please try again in a minute.";
  }
  if (status === 401 || status === 403) {
    return "Gemini authentication failed. Check your GEMINI_API_KEY.";
  }
  return `Embedding request failed${status ? ` (${status})` : ""}: ${raw}`;
}

// ─── Metin oluşturucular (saf fonksiyonlar) ──────────────────────────────────

interface JobEmbedInput {
  title:       string;
  company:     string;
  location:    string | null;
  workType:    string;
  jobType:     string;
  description: string | null;
}

/**
 * Job'un kanonik embedding metni. Sırası başlıkta-tekrar deseniyle önemli
 * sinyalleri öne çıkarır: title + company > location/workType > description.
 */
export function buildJobEmbedText(job: JobEmbedInput): string {
  const meta = [job.location ?? "—", job.workType, job.jobType].join(" | ");
  return [
    `${job.title} at ${job.company}`,
    `Location: ${meta}`,
    "",
    job.description?.trim() ?? "",
  ]
    .join("\n")
    .trim();
}

interface ProjectEmbedInput {
  name:        string;
  description: string | null;
  techStack:   string[];
}

export function buildProjectEmbedText(project: ProjectEmbedInput): string {
  const tech = project.techStack.length ? project.techStack.join(", ") : "—";
  return [
    project.name,
    `Tech: ${tech}`,
    "",
    project.description?.trim() ?? "",
  ]
    .join("\n")
    .trim();
}

// ─── Düşük seviye: tek API çağrısı ───────────────────────────────────────────

type EmbedOnceResult =
  | { ok: true; values: number[] }
  | {
      ok: false;
      status: number | null;
      message: string;
      /** transient = retry/backoff ile çözülebilir; non-transient = hemen vazgeç */
      transient: boolean;
    };

async function callEmbedOnce(
  text: string,
  taskType: EmbeddingTaskType,
  apiKey: string,
): Promise<EmbedOnceResult> {
  let res: Response;
  try {
    res = await fetch(
      `${GEMINI_BASE}/${GEMINI_EMBEDDING_MODEL}:embedContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model:                `models/${GEMINI_EMBEDDING_MODEL}`,
          content:              { parts: [{ text }] },
          taskType,
          // Modelin varsayılan boyutu 3072; pgvector kolonuyla uyum için 768 zorunlu.
          outputDimensionality: EMBEDDING_DIMENSIONS,
        }),
      },
    );
  } catch (e) {
    return {
      ok: false,
      status: null,
      message: e instanceof Error ? e.message : "Network error",
      transient: true,
    };
  }

  if (!res.ok) {
    const errBody = (await res.json().catch(() => null)) as GeminiEmbeddingResponse | null;
    const detail = errBody?.error?.message ?? res.statusText;
    return {
      ok: false,
      status: res.status,
      message: detail,
      transient: TRANSIENT_STATUSES.has(res.status),
    };
  }

  const data = (await res.json()) as GeminiEmbeddingResponse;
  const values = data.embedding?.values;

  if (!Array.isArray(values) || values.length !== EMBEDDING_DIMENSIONS) {
    return {
      ok: false,
      status: 200,
      message: `Gemini returned malformed embedding (got ${values?.length ?? 0} dims, expected ${EMBEDDING_DIMENSIONS}).`,
      transient: false,
    };
  }

  return { ok: true, values };
}

// ─── Public: tekil embedding üretimi ─────────────────────────────────────────

/**
 * Verilen metin için Gemini text-embedding-004 ile 768-dim vektör üretir.
 *  - Boş veya çok kısa metin → EmbeddingTooShortError
 *  - Geçici hata (429/5xx, ağ) → exponential backoff ile MAX_RETRIES kadar dene
 *  - Kalıcı hata (4xx auth/invalid) → hemen fırlat
 */
export async function generateEmbedding(
  text: string,
  taskType: EmbeddingTaskType = "RETRIEVAL_DOCUMENT",
): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new MissingApiKeyError();

  const trimmed = text.trim();
  if (trimmed.length < MIN_INPUT_CHARS) throw new EmbeddingTooShortError();

  const input = truncate(trimmed);

  let lastError  = "Unknown error";
  let lastStatus: number | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const result = await callEmbedOnce(input, taskType, apiKey);
    if (result.ok) return result.values;

    lastError  = result.message;
    lastStatus = result.status;

    if (!result.transient) {
      throw new GeminiEmbeddingError(formatUserMessage(result.status, result.message));
    }

    if (attempt < MAX_RETRIES - 1) {
      // 800ms, 1600ms, 3200ms exponential backoff
      await sleep(BACKOFF_BASE_MS * 2 ** attempt);
    }
  }

  throw new GeminiEmbeddingError(formatUserMessage(lastStatus, lastError));
}

// ─── Public: domain seviyesi embed işlemleri ─────────────────────────────────

export interface EmbedOptions {
  /** Stale-check'i atla, embedding'i her durumda yeniden üret. */
  force?: boolean;
}

export interface EmbedResult {
  /** DB'ye yeni embedding yazıldı mı? false ise stale değildi veya içerik çok kısaydı. */
  updated: boolean;
  /** Yazılmadıysa neden? */
  reason?: "fresh" | "too-short";
}

/**
 * Job kaydının embedding'ini günceller.
 *  - Kayıt sahipliği userId ile zorunlu kılınır (data isolation).
 *  - Stale değilse no-op döner; force=true ile zorlanabilir.
 *  - İçerik MIN_INPUT_CHARS altındaysa sessizce no-op (kullanıcıya hata değil,
 *    "henüz hazır değil" semantiği).
 *
 * @throws Error            — Job bulunamadıysa
 * @throws MissingApiKeyError
 * @throws GeminiEmbeddingError
 */
export async function embedJob(
  jobId: string,
  userId: string,
  options: EmbedOptions = {},
): Promise<EmbedResult> {
  const job = await prisma.job.findFirst({
    where:  { id: jobId, userId },
    select: {
      id:          true,
      title:       true,
      company:     true,
      location:    true,
      workType:    true,
      jobType:     true,
      description: true,
      updatedAt:   true,
      embeddedAt:  true,
    },
  });

  if (!job) throw new Error("Job not found or you don't have access.");

  if (!options.force && !isEmbeddingStale(job)) {
    return { updated: false, reason: "fresh" };
  }

  const text = buildJobEmbedText(job);
  if (text.length < MIN_INPUT_CHARS) {
    return { updated: false, reason: "too-short" };
  }

  const values  = await generateEmbedding(text, "RETRIEVAL_DOCUMENT");
  const literal = toVectorLiteral(values);

  await prisma.$executeRaw`
    UPDATE "Job"
    SET "embedding"  = ${literal}::vector,
        "embeddedAt" = NOW()
    WHERE "id" = ${jobId} AND "userId" = ${userId}
  `;

  return { updated: true };
}

/**
 * Project kaydının embedding'ini günceller. Davranış embedJob ile birebir aynı.
 */
export async function embedProject(
  projectId: string,
  userId: string,
  options: EmbedOptions = {},
): Promise<EmbedResult> {
  const project = await prisma.project.findFirst({
    where:  { id: projectId, userId },
    select: {
      id:          true,
      name:        true,
      description: true,
      techStack:   true,
      updatedAt:   true,
      embeddedAt:  true,
    },
  });

  if (!project) throw new Error("Project not found or you don't have access.");

  if (!options.force && !isEmbeddingStale(project)) {
    return { updated: false, reason: "fresh" };
  }

  const text = buildProjectEmbedText(project);
  if (text.length < MIN_INPUT_CHARS) {
    return { updated: false, reason: "too-short" };
  }

  const values  = await generateEmbedding(text, "RETRIEVAL_DOCUMENT");
  const literal = toVectorLiteral(values);

  await prisma.$executeRaw`
    UPDATE "Project"
    SET "embedding"  = ${literal}::vector,
        "embeddedAt" = NOW()
    WHERE "id" = ${projectId} AND "userId" = ${userId}
  `;

  return { updated: true };
}
