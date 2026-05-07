// Gemini REST API ince katman.
// SDK kullanmıyoruz — sadece fetch ile çalışıyoruz, böylece bağımlılık eklemeden
// projeyi taşınabilir tutuyoruz.

/**
 * Sırasıyla denenecek model fallback zinciri.
 *  - İlk model 503 (overloaded) / 429 (rate limit) / 5xx alırsa bir sonrakine geç.
 *  - Aynı modelde kısa süreli 503'ler için tek bir retry de var.
 * Free tier'da çalışan, 200 OK dönen modeller seçildi.
 */
const GEMINI_MODEL_CHAIN = [
  "gemini-2.5-flash",          // primary — daha kaliteli + daha stabil altyapı
  "gemini-flash-lite-latest",  // fallback 1 — hafif, hızlı
  "gemini-2.5-flash-lite",     // fallback 2
];

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta/models";

// Geçici (transient) sayılan HTTP kodları → retry / fallback tetikler
const TRANSIENT_STATUSES = new Set([429, 500, 502, 503, 504]);

export class MissingApiKeyError extends Error {
  constructor() {
    super(
      "AI analysis is unavailable because GEMINI_API_KEY is not configured. " +
        "Add it to your .env file to enable this feature.",
    );
    this.name = "MissingApiKeyError";
  }
}

export class GeminiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GeminiError";
  }
}

interface GeminiResponse {
  candidates?: {
    content?: {
      parts?: { text?: string }[];
    };
  }[];
  error?: { message?: string; status?: string };
}

type CallOnceResult =
  | { ok: true; text: string }
  | {
      ok: false;
      status: number | null;
      message: string;
      /** transient = retry/fallback ile çözülebilir; non-transient = hemen vazgeç */
      transient: boolean;
    };

async function callOnce(model: string, prompt: string, apiKey: string): Promise<CallOnceResult> {
  let res: Response;
  try {
    res = await fetch(`${GEMINI_BASE}/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
      }),
    });
  } catch (e) {
    // Ağ hatası — geçici sayalım
    return { ok: false, status: null, message: e instanceof Error ? e.message : "Network error", transient: true };
  }

  if (!res.ok) {
    const errBody = (await res.json().catch(() => null)) as GeminiResponse | null;
    const detail = errBody?.error?.message ?? res.statusText;
    return {
      ok: false,
      status: res.status,
      message: detail,
      transient: TRANSIENT_STATUSES.has(res.status),
    };
  }

  const data = (await res.json()) as GeminiResponse;
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    return { ok: false, status: 200, message: "Gemini returned no content.", transient: false };
  }

  return { ok: true, text };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Gemini'ye prompt gönderir, JSON formatında metin döner.
 * Strateji:
 *  - Birincil modeli iki kez dener (arada 800ms backoff).
 *  - 5xx/429 alırsa zincirdeki sonraki modele geçer.
 *  - 4xx (auth, invalid request) gibi non-transient hatalarda hemen vazgeçer.
 */
export async function callGeminiJson(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new MissingApiKeyError();

  let lastError = "Unknown error";
  let lastStatus: number | null = null;

  for (const model of GEMINI_MODEL_CHAIN) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const result = await callOnce(model, prompt, apiKey);

      if (result.ok) return result.text;

      lastError = result.message;
      lastStatus = result.status;

      // Geçici değilse bu modeli ve zinciri tamamen bırak
      if (!result.transient) {
        throw new GeminiError(formatUserMessage(result.status, result.message));
      }

      // İlk deneme başarısızsa kısa bekleyip tekrar dene; ikincisi de patlarsa zincirdeki sonraki modele geçilecek
      if (attempt === 0) await sleep(800);
    }
    // Aynı model iki kez patladı → fallback'e geç
  }

  throw new GeminiError(formatUserMessage(lastStatus, lastError));
}

function formatUserMessage(status: number | null, raw: string): string {
  if (status === 503) {
    return "Gemini is temporarily overloaded. Please try again in a few seconds.";
  }
  if (status === 429) {
    return "Gemini quota reached for now. Please try again in a minute.";
  }
  if (status === 401 || status === 403) {
    return "Gemini authentication failed. Check your GEMINI_API_KEY.";
  }
  return `AI request failed${status ? ` (${status})` : ""}: ${raw}`;
}
