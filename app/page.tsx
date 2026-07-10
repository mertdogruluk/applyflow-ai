import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  Zap,
  Sparkles,
  Briefcase,
  FolderKanban,
  BarChart3,
  ArrowRight,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export const metadata = {
  title: "ApplyFlow AI — Track jobs, generate AI-powered match analysis",
  description:
    "An AI-powered job application tracker that links your portfolio projects to job descriptions and generates tailored CV bullets and cover letters.",
};

const FEATURE_ICONS = [Briefcase, FolderKanban, Sparkles, BarChart3] as const;
const FEATURE_KEYS = ["f1", "f2", "f3", "f4"] as const;

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  const t = await getTranslations("landing");

  return (
    <div className="aurora-canvas flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-br from-primary to-primary/70 shadow-glow ring-1 ring-inset ring-white/15">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight">
            ApplyFlow AI
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">{t("signIn")}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">{t("getStarted")}</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 pt-16 pb-12 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-xs text-primary">
            <Sparkles className="h-3 w-3" />
            {t("badge")}
          </span>
          <h1 className="mt-6 text-3xl font-semibold tracking-tight text-balance sm:text-5xl sm:leading-[1.15]">
            {t("heroLead")}{" "}
            <span className="text-primary">{t("heroAccent")}</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            {t("heroSub")}
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link href="/sign-up">
                {t("ctaStart")} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/sign-in">{t("ctaHaveAccount")}</Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-5xl px-6 pb-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURE_KEYS.map((key, i) => {
              const Icon = FEATURE_ICONS[i];
              return (
                <div
                  key={key}
                  className="rounded-xl border border-border bg-card/60 p-6 shadow-soft backdrop-blur-xl transition-all duration-300 ease-out hover:-translate-y-0.5 hover:shadow-elevated"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <h3 className="mt-4 text-sm font-semibold tracking-tight">
                    {t(`${key}Title`)}
                  </h3>
                  <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                    {t(`${key}Desc`)}
                  </p>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-5 text-center text-xs text-muted-foreground">
        Mert Dogruluk
      </footer>
    </div>
  );
}
