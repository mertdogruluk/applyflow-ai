import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
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

const FEATURES = [
  {
    icon: Briefcase,
    title: "Track every application",
    desc: "Status, timeline, CV version, cover letter, notes — all in one place.",
  },
  {
    icon: FolderKanban,
    title: "Link your portfolio",
    desc: "Connect your GitHub projects to specific jobs to surface the right work.",
  },
  {
    icon: Sparkles,
    title: "AI match analysis",
    desc: "Gemini scores each fit, suggests CV bullets, and drafts a cover letter.",
  },
  {
    icon: BarChart3,
    title: "Know your numbers",
    desc: "Response rate, interview conversion, and monthly trends at a glance.",
  },
];

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight">
            ApplyFlow AI
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">Sign in</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">Get started</Link>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col">
        <section className="mx-auto flex w-full max-w-3xl flex-col items-center px-6 pt-16 pb-12 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            Powered by Google Gemini
          </span>
          <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
            Land more interviews with{" "}
            <span className="text-primary">AI-tailored applications.</span>
          </h1>
          <p className="mt-4 max-w-xl text-base text-muted-foreground sm:text-lg">
            ApplyFlow AI tracks every job application, links your portfolio
            projects, and generates a match score, CV bullets, and a cover
            letter draft for each role — in seconds.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link href="/sign-up">
                Start tracking free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/sign-in">I have an account</Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto w-full max-w-5xl px-6 pb-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-border bg-card p-5"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  <f.icon className="h-4 w-4 text-foreground/80" />
                </div>
                <h3 className="mt-4 text-sm font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-xs leading-5 text-muted-foreground">
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border px-6 py-5 text-center text-xs text-muted-foreground">
        Built with Next.js, Prisma, Clerk &amp; Gemini.
      </footer>
    </div>
  );
}
