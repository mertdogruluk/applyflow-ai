// Keşif (Discovery) katmanının kaynak-bağımsız tipleri.
// Kaynaklar (Remotive, JSearch) aynı DiscoveredJob şekline map edilir —
// engine ve UI kaynaktan bağımsız kalır.

import type { WorkType } from "@prisma/client";

export type DiscoverySource = "remotive" | "jsearch";

/** Dış kaynaktan çekilmiş, normalize edilmiş gerçek ilan. */
export interface DiscoveredJob {
  /** Kaynak içi benzersiz kimlik (dedupe + judge eşleşmesi için). */
  externalId: string;
  source:     DiscoverySource;
  title:      string;
  company:    string;
  /** Kaynağın bildirdiği lokasyon/kapsam (örn. "Worldwide", "Istanbul, TR"). */
  location:   string | null;
  url:        string;
  /** HTML'den arındırılmış düz metin açıklama. */
  description: string;
  /** Kaynağın teknoloji etiketleri (keyword ön elemede güçlü sinyal). */
  tags:        string[];
  salary:      string | null;
  publishedAt: string | null;
  /** Kaynaktan türetilen çalışma tipi; kaynak bildirmiyorsa null. */
  workType:    WorkType | null;
}

/** Judge'dan geçmiş, skorlanmış keşif sonucu. */
export interface DiscoveredMatch extends DiscoveredJob {
  /** LLM-as-a-Judge skoru (0-100) — Faz 4 ile aynı adalet kuralları. */
  fitScore:  number;
  /** Hakemin tek cümlelik gerekçesi. */
  reasoning: string;
}

/** Keşif panelinden gelen kullanıcı filtreleri. */
export interface DiscoveryFilters {
  source:    DiscoverySource;
  /** Serbest arama terimi; boşsa profil becerilerinden türetilir. */
  query?:    string;
  /** Şehir/bölge (yalnızca JSearch anlamlandırır, örn. "Istanbul"). */
  location?: string;
  /** Çalışma tipi filtresi; "ANY" = filtre yok. */
  workType?: WorkType | "ANY";
}
