// Keşif (Discovery) katmanının kaynak-bağımsız tipleri.
// Remotive bugünkü kaynak; JSearch/Adzuna eklendiğinde aynı DiscoveredJob
// şekline map edilir — engine ve UI hiç değişmez.

export type DiscoverySource = "remotive";

/** Dış kaynaktan çekilmiş, normalize edilmiş gerçek ilan. */
export interface DiscoveredJob {
  /** Kaynak içi benzersiz kimlik (dedupe + judge eşleşmesi için). */
  externalId: string;
  source:     DiscoverySource;
  title:      string;
  company:    string;
  /** Kaynağın bildirdiği lokasyon/kapsam (örn. "Worldwide", "Europe"). */
  location:   string | null;
  url:        string;
  /** HTML'den arındırılmış düz metin açıklama. */
  description: string;
  /** Kaynağın teknoloji etiketleri (keyword ön elemede güçlü sinyal). */
  tags:        string[];
  salary:      string | null;
  publishedAt: string | null;
}

/** Judge'dan geçmiş, skorlanmış keşif sonucu. */
export interface DiscoveredMatch extends DiscoveredJob {
  /** LLM-as-a-Judge skoru (0-100) — Faz 4 ile aynı adalet kuralları. */
  fitScore:  number;
  /** Hakemin tek cümlelik gerekçesi. */
  reasoning: string;
}
