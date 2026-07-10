"use client";

import { useRef, useState, type DragEvent } from "react";
import { CloudUpload, FileText } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

const ACCEPTED_EXTENSIONS = [".txt", ".md"];
const MAX_FILE_SIZE_BYTES = 200 * 1024; // 200 KB — CV metni için fazlasıyla geniş

interface CvUploadZoneProps {
  disabled?: boolean;
  /** Dosya başarıyla okunduğunda ham metinle çağrılır. */
  onFileText: (text: string, fileName: string) => void;
  /** Kullanıcıya gösterilecek doğrulama hataları (yanlış format, boyut). */
  onError: (message: string) => void;
}

/**
 * Sürükle-bırak CV alanı. Kesik çizgili çerçeve; sürükleme sırasında
 * primary vurgu (border + hafif zemin). Tıklanınca dosya seçici açılır.
 * Yalnızca düz metin dosyaları (.txt/.md) — PDF çıkarımı ayrı bir faz.
 */
export function CvUploadZone({ disabled, onFileText, onError }: CvUploadZoneProps) {
  const t = useTranslations("profile");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  async function handleFile(file: File) {
    const name = file.name.toLowerCase();
    if (!ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
      onError(t("errOnlyText"));
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      onError(t("errTooLarge"));
      return;
    }

    try {
      const text = await file.text();
      onFileText(text, file.name);
    } catch {
      onError(t("errRead"));
    }
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label={t("uploadAria")}
      onClick={() => !disabled && inputRef.current?.click()}
      onKeyDown={(e) => {
        if (!disabled && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors outline-none",
        "focus-visible:ring-3 focus-visible:ring-ring/50",
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border bg-muted/30 hover:border-primary/50 hover:bg-muted/50",
        disabled && "pointer-events-none opacity-50",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void handleFile(file);
          e.target.value = ""; // aynı dosya tekrar seçilebilsin
        }}
      />

      <div
        className={cn(
          "flex size-12 items-center justify-center rounded-full transition-colors",
          isDragging ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
        )}
      >
        <CloudUpload className="size-6" />
      </div>

      <div className="space-y-1">
        <p className="text-sm font-medium">
          {isDragging ? t("dropHere") : t("dragDrop")}
        </p>
        <p className="text-xs text-muted-foreground">
          {t("or")} <span className="font-medium text-primary">{t("browse")}</span>
        </p>
      </div>

      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        <FileText className="size-3" />
        {t("fileHint")}
      </p>
    </div>
  );
}
