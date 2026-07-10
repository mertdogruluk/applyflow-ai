-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('ANALYSIS_READY', 'JOB_ENRICHED', 'STATUS_CHANGED', 'JOB_DISCOVERED', 'MATCH_READY');

-- DropIndex
DROP INDEX "CandidateProfile_embedding_idx";

-- DropIndex
DROP INDEX "Job_embedding_idx";

-- DropIndex
DROP INDEX "Project_embedding_idx";

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT,
    "jobId" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
