"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { enUS, trTR } from "@clerk/localizations";
import { useLocale } from "next-intl";
import { ThemeProvider, useTheme } from "next-themes";

/**
 * Clerk bileşenlerinin (SignIn, UserButton…) aktif temayı VE dili takip
 * etmesi için ClerkProvider, next-themes'in çözdüğü temaya ve next-intl'in
 * cookie'den okuduğu locale'e göre yapılandırılır.
 * colorPrimary globals.css'teki --primary değerleriyle birebir aynıdır.
 */
function ClerkWithTheme({ children }: { children: React.ReactNode }) {
  const { resolvedTheme } = useTheme();
  const locale = useLocale();
  const isDark = resolvedTheme === "dark";

  return (
    <ClerkProvider
      localization={locale === "tr" ? trTR : enUS}
      appearance={{
        baseTheme: isDark ? dark : undefined,
        variables: {
          colorPrimary: isDark
            ? "oklch(0.72 0.13 172)"
            : "oklch(0.55 0.13 172)",
          borderRadius: "0.7rem",
          fontFamily: "var(--font-jakarta), ui-sans-serif, system-ui, sans-serif",
        },
        elements: {
          userButtonPopoverFooter: "hidden",
        },
      }}
    >
      {children}
    </ClerkProvider>
  );
}

/**
 * Uygulama geneli istemci sağlayıcıları. next-themes `class` stratejisiyle
 * `.dark` sınıfını <html>'e basar; varsayılan deneyim karanlık moddur,
 * sistem tercihi de desteklenir.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <ClerkWithTheme>{children}</ClerkWithTheme>
    </ThemeProvider>
  );
}
