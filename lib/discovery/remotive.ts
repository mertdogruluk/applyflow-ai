// Remotive API istemcisi — https://remotive.com/api/remote-jobs
// Ücretsiz, API key gerektirmez, gerçek remote yazılım ilanları döner.
// Kaynak-bağımsız DiscoveredJob şekline normalize eder.

import type { DiscoveredJob } from "@/lib/discovery/types";

const REMOTIVE_ENDPOINT = "https://remotive.com/api/remote-jobs";

/** Tek istekte çekilecek ilan sayısı — ön eleme havuzu. */
const FETCH_LIMIT = 100;

export class DiscoveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DiscoveryError";
  }
}

interface RemotiveJob {
  id:                          number;
  url:                         string;
  title:                       string;
  company_name:                string;
  candidate_required_location: string;
  publication_date:            string;
  salary:                      string;
  description:                 string; // HTML
  tags:                        string[];
}

interface RemotiveResponse {
  jobs?: RemotiveJob[];
}

/**
 * HTML açıklamayı düz metne indirger: script/style blokları atılır,
 * blok elemanları satır sonuna çevrilir, kalan tag'ler temizlenir,
 * yaygın entity'ler çözülür. Judge prompt'u ve DB kaydı bu metni kullanır.
 * Export: jooble.ts de aynı temizliği kullanır.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<\/(p|div|li|h[1-6]|tr)>/gi, "\n")
    .replace(/<(br|hr)\s*\/?>/gi, "\n")
    .replace(/<li[^>]*>/gi, "- ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Remotive'den software-dev kategorisindeki güncel ilanları çeker.
 * Keyword filtrelemesi burada YAPILMAZ — o, engine'in işi (kaynak-bağımsız).
 */
export async function fetchRemotiveJobs(): Promise<DiscoveredJob[]> {
  let res: Response;
  try {
    res = await fetch(
      `${REMOTIVE_ENDPOINT}?category=software-dev&limit=${FETCH_LIMIT}`,
      // İlanlar dakikada değişmez; Next fetch cache'i ile 15 dk tazelik yeterli
      { next: { revalidate: 900 } },
    );
  } catch (e) {
    throw new DiscoveryError(
      `Could not reach the job source: ${e instanceof Error ? e.message : "network error"}`,
    );
  }

  if (!res.ok) {
    throw new DiscoveryError(`Job source responded with ${res.status}. Please try again shortly.`);
  }

  const data = (await res.json().catch(() => null)) as RemotiveResponse | null;
  if (!data?.jobs || !Array.isArray(data.jobs)) {
    throw new DiscoveryError("Job source returned an unexpected shape.");
  }

  return data.jobs.map((j) => ({
    externalId:  String(j.id),
    source:      "remotive" as const,
    title:       j.title,
    company:     j.company_name,
    location:    j.candidate_required_location || null,
    url:         j.url,
    description: stripHtml(j.description ?? ""),
    tags:        Array.isArray(j.tags) ? j.tags : [],
    salary:      j.salary || null,
    publishedAt: j.publication_date || null,
    workType:    "REMOTE" as const, // Remotive = yalnızca remote ilanlar
  }));
}
