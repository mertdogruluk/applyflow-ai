-- ─── pgvector eklentisi (idempotent — önceki migration'da kuruldu) ──────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ─── AlterTable: Job → structured gereksinim alanları ───────────────────────
-- lib/ai/job-parser.ts (parseJob) çıktısı bu kolonlara yazılır.
ALTER TABLE "Job"
    ADD COLUMN "mustHaves"          TEXT[],
    ADD COLUMN "niceToHaves"        TEXT[],
    ADD COLUMN "minYearsExperience" INTEGER,
    ADD COLUMN "parsedAt"           TIMESTAMP(3);

-- ─── CreateTable: CandidateProfile ──────────────────────────────────────────
-- Clerk userId başına 1 kayıt; lib/ai/cv-parser.ts (parseCv) çıktısını tutar.
CREATE TABLE "CandidateProfile" (
    "userId"            TEXT             NOT NULL,
    "cvText"            TEXT,
    "coreSkills"        TEXT[],
    "toolsTech"         TEXT[],
    "yearsOfExperience" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "embedding"         vector(768),
    "embeddedAt"        TIMESTAMP(3),
    "createdAt"         TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP(3)     NOT NULL,

    CONSTRAINT "CandidateProfile_pkey" PRIMARY KEY ("userId")
);

-- ─── pgvector ivfflat index ─────────────────────────────────────────────────
-- Job/Project index'leriyle aynı yapı: cosine ops, lists = 100.
CREATE INDEX "CandidateProfile_embedding_idx"
    ON "CandidateProfile" USING ivfflat ("embedding" vector_cosine_ops)
    WITH (lists = 100);
