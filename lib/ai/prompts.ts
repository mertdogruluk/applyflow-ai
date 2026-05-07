// Gemini'ye gönderilen prompt'ları tek noktada tutuyoruz.
// Burayı değiştirerek AI'ın çıktı kalitesini iyileştirebiliriz.

interface ProjectInput {
  name: string;
  description: string | null;
  techStack: string[];
}

interface PromptInput {
  title:       string;
  company:     string;
  description: string | null;
  projects:    ProjectInput[];
}

/**
 * Gemini'den JSON formatında çıktı isteyen prompt.
 * `responseMimeType: application/json` ile birlikte kullanılır.
 */
export function buildAnalysisPrompt(input: PromptInput): string {
  const projectBlock = input.projects.length
    ? input.projects
        .map(
          (p, i) =>
            `Project ${i + 1}: ${p.name}\n` +
            `  Tech: ${p.techStack.join(", ") || "—"}\n` +
            `  Description: ${p.description ?? "—"}`,
        )
        .join("\n\n")
    : "(No portfolio projects linked.)";

  return `You are a senior career coach helping a candidate apply for a job.
Analyze the match between the job and the candidate's portfolio projects.

Return ONLY valid JSON (no markdown, no commentary) matching this shape:
{
  "matchScore": number (0-100),
  "summary": string (1-2 sentences),
  "strengths": string[] (3-5 short bullets, candidate's strongest fits),
  "missingKeywords": string[] (3-5 short bullets, what's missing/weak),
  "recommendedCvBullets": string[] (3-5 ATS-friendly resume bullets, action verb + result),
  "coverLetterDraft": string (a concise 3-paragraph cover letter draft, plain text, no greeting placeholders)
}

JOB
Title: ${input.title}
Company: ${input.company}
Description:
${input.description ?? "(no description provided)"}

CANDIDATE PROJECTS
${projectBlock}

Be concrete. Reference actual technologies and project names where possible.
If projects are missing, lower the match score and suggest concrete projects to build.`;
}
