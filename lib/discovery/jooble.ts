// Jooble istemcisi — https://jooble.org/api/about
// Türkiye dahil 60+ ülkede yerel ilan toplar (tr.jooble.org alan adı TR
// sonuçlarını verir). JOOBLE_API_KEY gerektirir; kaynak-bağımsız
// DiscoveredJob şekline normalize eder.

import type { WorkType } from "@prisma/client";

import { DiscoveryError, stripHtml } from "@/lib/discovery/remotive";
import type { DiscoveredJob } from "@/lib/discovery/types";

// Ülke, istek atılan alan adından belirlenir — tr.jooble.org = Türkiye.
const JOOBLE_HOST = "https://tr.jooble.org";

interface JoobleJob {
  id:       number | string;
  title:    string;
  location: string | null;
  snippet:  string | null;
  salary:   string | null;
  /** İlanın geldiği pano (örn. "kariyer.net") — company boşsa geri dönüş. */
  source:   string | null;
  type:     string | null;
  link:     string;
  company:  string | null;
  updated:  string | null;
}

interface JoobleResponse {
  totalCount?: number;
  jobs?: JoobleJob[];
}

/**
 * İlan metninden çalışma tipini türet. Jooble remote bayrağı vermez;
 * metinde sinyal yoksa null döner (bilinmiyor) — engine null'u elemez.
 */
function deriveWorkType(j: JoobleJob): WorkType | null {
  const text = `${j.title} ${j.type ?? ""} ${(j.snippet ?? "").slice(0, 2_000)}`.toLowerCase();
  if (text.includes("hybrid") || text.includes("hibrit")) return "HYBRID";
  if (text.includes("remote") || text.includes("uzaktan") || text.includes("evden çalışma")) {
    return "REMOTE";
  }
  return null;
}

export interface JoobleParams {
  /** Arama terimi (örn. "react developer"). Zorunlu — Jooble keywords ister. */
  query: string;
  /** Şehir/bölge (örn. "İstanbul"); Jooble'ın location alanına geçer. */
  location?: string;
  /** true → "remote" sorguya eklenir (Jooble'da ayrı bayrak yok). */
  remoteOnly?: boolean;
}

/**
 * Jooble'dan gerçek Türkiye ilanlarını çeker. Keyword ön elemesi engine'in işi.
 *
 * @throws DiscoveryError — anahtar eksikse veya kaynak ulaşılamaz/bozuksa
 */
export async function fetchJoobleJobs(params: JoobleParams): Promise<DiscoveredJob[]> {
  const apiKey = process.env.JOOBLE_API_KEY;
  if (!apiKey) {
    throw new DiscoveryError(
      "Türkiye job search is not configured — add JOOBLE_API_KEY to your .env (free key from jooble.org/api/about).",
    );
  }

  const keywords = params.remoteOnly ? `${params.query} remote` : params.query;

  let res: Response;
  try {
    res = await fetch(`${JOOBLE_HOST}/api/${apiKey}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        keywords,
        location: params.location ?? "",
        page:     "1",
      }),
      // İlanlar dakikada değişmez; API kotasını da korur (15 dk cache).
      next: { revalidate: 900 },
    });
  } catch (e) {
    throw new DiscoveryError(
      `Could not reach the job source: ${e instanceof Error ? e.message : "network error"}`,
    );
  }

  if (res.status === 401 || res.status === 403) {
    // Jooble anahtarları kayıt olunan ülke alan adına bağlıdır — genel
    // (jooble.org) anahtarı tr.jooble.org'da 403 alır.
    throw new DiscoveryError(
      "Jooble rejected the API key — make sure JOOBLE_API_KEY was issued for Türkiye (register at tr.jooble.org/api/about).",
    );
  }
  if (res.status === 429) {
    throw new DiscoveryError("Jooble rate limit reached — try again in a minute.");
  }
  if (!res.ok) {
    throw new DiscoveryError(`Job source responded with ${res.status}. Please try again shortly.`);
  }

  const data = (await res.json().catch(() => null)) as JoobleResponse | null;
  const jobs = data?.jobs;
  if (!Array.isArray(jobs)) {
    throw new DiscoveryError("Job source returned an unexpected shape.");
  }

  return jobs
    .filter((j) => j.id != null && j.title && j.link)
    .map((j) => ({
      externalId:  String(j.id),
      source:      "jooble" as const,
      title:       j.title,
      // Jooble bazen şirket adını boş bırakır — kaynak panosu makul geri dönüş.
      company:     j.company?.trim() || j.source?.trim() || "Unknown company",
      location:    j.location?.trim() || null,
      url:         j.link,
      description: stripHtml(j.snippet ?? ""),
      tags:        [], // Jooble etiket vermez; ön eleme başlık+açıklamadan çalışır
      salary:      j.salary?.trim() || null,
      publishedAt: j.updated,
      workType:    deriveWorkType(j),
    }));
}
