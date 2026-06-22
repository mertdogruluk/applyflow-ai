-- ─── pgvector eklentisi ──────────────────────────────────────────────────────
-- Idempotent; Supabase / Neon / Railway üzerinde pgvector zaten yüklüdür,
-- bu komut sadece extension'ı bu database için aktive eder.
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── CreateEnum ──────────────────────────────────────────────────────────────
CREATE TYPE "MatchVerdict" AS ENUM ('STRONG_FIT', 'MODERATE_FIT', 'WEAK_FIT', 'NOT_RELEVANT');

-- ─── AlterTable: Job → embedding kolonları ──────────────────────────────────
ALTER TABLE "Job"
    ADD COLUMN "embedding"  vector(768),
    ADD COLUMN "embeddedAt" TIMESTAMP(3);

-- ─── AlterTable: Project → embedding kolonları ──────────────────────────────
ALTER TABLE "Project"
    ADD COLUMN "embedding"  vector(768),
    ADD COLUMN "embeddedAt" TIMESTAMP(3);

-- ─── CreateTable: MatchResult ───────────────────────────────────────────────
CREATE TABLE "MatchResult" (
    "id"         TEXT             NOT NULL,
    "jobId"      TEXT             NOT NULL,
    "projectId"  TEXT             NOT NULL,
    "fitScore"   INTEGER          NOT NULL,
    "similarity" DOUBLE PRECISION NOT NULL,
    "verdict"    "MatchVerdict"   NOT NULL,
    "reasoning"  TEXT             NOT NULL,
    "strengths"  TEXT[],
    "gaps"       TEXT[],
    "rawResult"  JSONB,
    "judgedAt"   TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchResult_pkey" PRIMARY KEY ("id")
);

-- ─── Unique & Lookup Index'leri ─────────────────────────────────────────────
-- Aynı (job, project) çifti yeniden yargılanırsa upsert için gerekli.
CREATE UNIQUE INDEX "MatchResult_jobId_projectId_key" ON "MatchResult"("jobId", "projectId");
CREATE INDEX        "MatchResult_jobId_idx"           ON "MatchResult"("jobId");
CREATE INDEX        "MatchResult_projectId_idx"       ON "MatchResult"("projectId");

-- ─── Foreign Keys ───────────────────────────────────────────────────────────
ALTER TABLE "MatchResult"
    ADD CONSTRAINT "MatchResult_jobId_fkey"
    FOREIGN KEY ("jobId") REFERENCES "Job"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MatchResult"
    ADD CONSTRAINT "MatchResult_projectId_fkey"
    FOREIGN KEY ("projectId") REFERENCES "Project"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- ─── pgvector ivfflat index'leri ────────────────────────────────────────────
-- Cosine similarity için vector_cosine_ops. lists = 100, < 100K row için ideal.
-- Büyürse: lists ≈ sqrt(N) formülüyle artırılmalı (yeniden migration).
-- NOT: Boş tabloda index oluşturulabilir; veri girene kadar planner seq scan
-- yapar — bu beklenen davranış, sorun değil.
CREATE INDEX "Project_embedding_idx"
    ON "Project" USING ivfflat ("embedding" vector_cosine_ops)
    WITH (lists = 100);

CREATE INDEX "Job_embedding_idx"
    ON "Job" USING ivfflat ("embedding" vector_cosine_ops)
    WITH (lists = 100);
