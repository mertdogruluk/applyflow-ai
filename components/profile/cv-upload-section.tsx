"use client";

import { useState, useTransition } from "react";
import { ClipboardPaste, CloudUpload, Loader2, RotateCcw, Sparkles, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CvUploadZone } from "@/components/profile/cv-upload-zone";
import { CvAnalysisSkeleton } from "@/components/profile/cv-analysis-skeleton";
import {
  ProfileSummaryCard,
  type ProfileSummaryData,
} from "@/components/profile/profile-summary-card";
import { updateCandidateProfile } from "@/app/(dashboard)/profile/actions";

type InputMode = "upload" | "paste";

interface CvUploadSectionProps {
  /** Sayfa açılışında DB'den gelen kayıtlı profil (yoksa null). */
  initialProfile: ProfileSummaryData | null;
}

/**
 * CV yükleme akışının durum makinesi:
 *   idle → (dosya/metin) → analyzing → success | error
 * Analiz sırasında iskelet gösterilir — ekran asla donuk kalmaz.
 */
export function CvUploadSection({ initialProfile }: CvUploadSectionProps) {
  const [mode, setMode] = useState<InputMode>("upload");
  const [pasteValue, setPasteValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [freshResult, setFreshResult] = useState<ProfileSummaryData | null>(null);
  const [isPending, startTransition] = useTransition();

  const profileToShow = freshResult ?? initialProfile;

  function analyze(cvText: string) {
    setError(null);
    startTransition(async () => {
      const result = await updateCandidateProfile({ cvText });
      if (result.ok) {
        setFreshResult({
          coreSkills:        result.analysis.core_skills,
          toolsTech:         result.analysis.tools_and_tech,
          yearsOfExperience: result.analysis.years_of_experience,
        });
        setPasteValue("");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* ── Girdi alanı: upload zone veya paste modu ─────────────────────── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">
            {profileToShow ? "Update your CV" : "Upload your CV"}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            disabled={isPending}
            onClick={() => {
              setMode(mode === "upload" ? "paste" : "upload");
              setError(null);
            }}
          >
            {mode === "upload" ? (
              <>
                <ClipboardPaste data-icon="inline-start" />
                Paste text instead
              </>
            ) : (
              <>
                <CloudUpload data-icon="inline-start" />
                Upload a file instead
              </>
            )}
          </Button>
        </div>

        {mode === "upload" ? (
          <CvUploadZone
            disabled={isPending}
            onFileText={(text) => analyze(text)}
            onError={setError}
          />
        ) : (
          <div className="space-y-3">
            <Textarea
              value={pasteValue}
              onChange={(e) => setPasteValue(e.target.value)}
              disabled={isPending}
              placeholder="Paste the full text of your CV here…"
              className="min-h-40 resize-y"
            />
            <Button
              disabled={isPending || pasteValue.trim().length === 0}
              onClick={() => analyze(pasteValue)}
            >
              {isPending ? (
                <>
                  <Loader2 data-icon="inline-start" className="animate-spin" />
                  Analyzing…
                </>
              ) : (
                <>
                  <Sparkles data-icon="inline-start" />
                  Analyze CV
                </>
              )}
            </Button>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            <TriangleAlert className="mt-0.5 size-4 shrink-0" />
            <div className="flex-1">{error}</div>
            <Button variant="ghost" size="icon-xs" onClick={() => setError(null)} aria-label="Dismiss">
              <RotateCcw />
            </Button>
          </div>
        )}
      </div>

      {/* ── Sonuç alanı: iskelet → taze sonuç → kayıtlı profil ───────────── */}
      {isPending ? (
        <CvAnalysisSkeleton />
      ) : profileToShow ? (
        <ProfileSummaryCard profile={profileToShow} />
      ) : null}
    </div>
  );
}
