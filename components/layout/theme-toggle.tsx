"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";

/**
 * Aydınlık/karanlık mod anahtarı. İkon değişimi `.dark` sınıfına bağlı saf CSS
 * ile yapılır (JS koşullu render yok → hydration uyumsuzluğu yok); tıklama
 * çözülmüş temayı okuyup tersine çevirir.
 */
export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const t = useTranslations("common");

  return (
    <Button
      variant="ghost"
      size="icon"
      className="text-muted-foreground hover:text-foreground"
      aria-label={t("toggleTheme")}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-transform duration-300 ease-out dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-transform duration-300 ease-out dark:rotate-0 dark:scale-100" />
      <span className="sr-only">{t("toggleTheme")}</span>
    </Button>
  );
}
