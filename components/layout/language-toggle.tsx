"use client";

import { useTransition } from "react";
import { useLocale } from "next-intl";

import { Button } from "@/components/ui/button";
import { setLocale } from "@/app/actions/set-locale";
import type { AppLocale } from "@/i18n/request";

/**
 * EN ⇄ TR anahtarı. Cookie'yi server action ile yazar; layout revalidate
 * olunca tüm sayfa (server bileşenleri dahil) yeni dilde gelir.
 */
export function LanguageToggle() {
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();

  const next: AppLocale = locale === "tr" ? "en" : "tr";

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => setLocale(next))}
      aria-label={locale === "tr" ? "Switch to English" : "Türkçe'ye geç"}
      className="w-10 font-mono text-xs font-semibold tracking-wider text-muted-foreground hover:text-foreground"
    >
      {locale === "tr" ? "TR" : "EN"}
    </Button>
  );
}
