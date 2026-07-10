// JSearch (RapidAPI) istemcisi — https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch
// Google for Jobs'u toplar: Türkiye dahil yerel ilanlar, konum + remote filtresi.
// RAPIDAPI_KEY gerektirir; kaynak-bağımsız DiscoveredJob şekline normalize eder.

import type { WorkType } from "@prisma/client";

import { DiscoveryError, stripHtml } from "@/lib/discovery/remotive";
import type { DiscoveredJob } from "@/lib/discovery/types";

// Not: eski /search endpoint'i kaldırıldı ("Endpoint '/search' does not exist");
// güncel sürüm /search-v2 ve yanıt şekli { data: { jobs: [], cursor } }.
const JSEARCH_ENDPOINT = "https://jsearch.p.rapidapi.com/search-v2";
const JSEARCH_HOST = "jsearch.p.rapidapi.com";

interface JSearchJob {
  job_id:                     string;
  job_title:                  string;
  employer_name:              string;
  job_city:                   string | null;
  job_state:                  string | null;
  job_country:                string | null;
  job_apply_link:             string;
  job_description:            string;
  job_is_remote:              boolean | null;
  job_posted_at_datetime_utc: string | null;
  job_min_salary:             number | null;
  job_max_salary:             number | null;
  job_salary_currency:        string | null;
  job_employment_type:        string | null;
}

interface JSearchResponse {
  data?: {
    jobs?: JSearchJob[];
    cursor?: string | null;
  };
}

/** İlan metninden çalışma tipini türet: kaynak yalnızca remote'u işaretler. */
function deriveWorkType(j: JSearchJob): WorkType {
  if (j.job_is_remote) return "REMOTE";
  const text = `${j.job_title} ${j.job_description.slice(0, 2_000)}`.toLowerCase();
  if (text.includes("hybrid") || text.includes("hibrit")) return "HYBRID";
  return "ON_SITE";
}

function formatSalary(j: JSearchJob): string | null {
  if (!j.job_min_salary && !j.job_max_salary) return null;
  const currency = j.job_salary_currency ?? "";
  const min = j.job_min_salary ? Math.round(j.job_min_salary).toLocaleString("en-US") : null;
  const max = j.job_max_salary ? Math.round(j.job_max_salary).toLocaleString("en-US") : null;
  if (min && max) return `${min}–${max} ${currency}`.trim();
  return `${min ?? max} ${currency}`.trim();
}

function formatLocation(j: JSearchJob): string | null {
  const parts = [j.job_city, j.job_state, j.job_country].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : null;
}

export interface JSearchParams {
  /** Arama terimi (örn. "react developer"). Zorunlu — JSearch query ister. */
  query: string;
  /** Şehir/bölge; query'ye "in {location}" olarak eklenir. */
  location?: string;
  /** true → yalnızca remote ilanlar (API tarafında filtrelenir). */
  remoteOnly?: boolean;
}

/**
 * JSearch'ten gerçek ilanları çeker (country=tr — Türkiye öncelikli sonuçlar;
 * remote ilanlar globalden de gelebilir). Keyword ön elemesi engine'in işi.
 *
 * @throws DiscoveryError — anahtar eksikse veya kaynak ulaşılamaz/bozuksa
 */
export async function fetchJSearchJobs(params: JSearchParams): Promise<DiscoveredJob[]> {
  const apiKey = process.env.RAPIDAPI_KEY;
  if (!apiKey) {
    throw new DiscoveryError(
      "Türkiye job search is not configured — add RAPIDAPI_KEY to your .env (free key from rapidapi.com, JSearch API).",
    );
  }

  // country=tr zaten Türkiye kapsamını verir; konum verilmişse sorguya eklenir.
  const query = params.location
    ? `${params.query} jobs in ${params.location}`
    : `${params.query} jobs`;

  const url = new URL(JSEARCH_ENDPOINT);
  url.searchParams.set("query", query);
  url.searchParams.set("country", "tr");
  if (params.remoteOnly) url.searchParams.set("work_from_home", "true");

  let res: Response;
  try {
    res = await fetch(url.toString(), {
      headers: {
        "X-RapidAPI-Key":  apiKey,
        "X-RapidAPI-Host": JSEARCH_HOST,
      },
      // İlanlar dakikada değişmez; ücretli API kotasını da korur (15 dk cache).
      next: { revalidate: 900 },
    });
  } catch (e) {
    throw new DiscoveryError(
      `Could not reach the job source: ${e instanceof Error ? e.message : "network error"}`,
    );
  }

  if (res.status === 401 || res.status === 403) {
    throw new DiscoveryError("JSearch rejected the API key — check RAPIDAPI_KEY in your .env.");
  }
  if (res.status === 429) {
    throw new DiscoveryError("JSearch rate limit reached — try again in a minute.");
  }
  if (!res.ok) {
    throw new DiscoveryError(`Job source responded with ${res.status}. Please try again shortly.`);
  }

  const data = (await res.json().catch(() => null)) as JSearchResponse | null;
  const jobs = data?.data?.jobs;
  if (!Array.isArray(jobs)) {
    throw new DiscoveryError("Job source returned an unexpected shape.");
  }

  return jobs
    .filter((j) => j.job_id && j.job_title && j.employer_name && j.job_apply_link)
    .map((j) => ({
      externalId:  j.job_id,
      source:      "jsearch" as const,
      title:       j.job_title,
      company:     j.employer_name,
      location:    formatLocation(j),
      url:         j.job_apply_link,
      description: stripHtml(j.job_description ?? ""),
      tags:        [], // JSearch etiket vermez; ön eleme başlık+açıklamadan çalışır
      salary:      formatSalary(j),
      publishedAt: j.job_posted_at_datetime_utc,
      workType:    deriveWorkType(j),
    }));
}
