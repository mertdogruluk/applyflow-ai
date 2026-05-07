# ApplyFlow AI

> AI-powered job application tracker that links your portfolio projects to job
> descriptions and generates a fit score, tailored CV bullets, and a cover
> letter draft for each role — in seconds.

ApplyFlow AI is a full-stack Next.js application that turns the chaotic
spreadsheet-style job hunt into a single dashboard with a real AI analysis
layer on top.

---

## The problem it solves

Most candidates track their job search in a spreadsheet, lose track of which
CV version they sent, and rewrite the same cover letter for every role. They
also rarely link **the projects they actually built** to the keywords in the
job description.

ApplyFlow AI solves this by:

1. Centralising every application (status, CV version, deadline, notes).
2. Letting you register your portfolio projects (GitHub link, tech stack, summary).
3. Linking projects to specific jobs.
4. Sending the job description **plus** the linked projects to Gemini and
   asking for a structured fit analysis: match score, strengths, missing
   keywords, recommended CV bullets, and a cover-letter draft.

---

## Features

- **Auth** — Clerk-powered sign in / sign up with protected routes.
- **Jobs CRUD** — create, list, view, edit, delete; per-user data isolation.
- **Status workflow** — Saved → Applied → Technical Test → Interview → Offer →
  Accepted / Rejected / Withdrawn, with a one-click inline status change on
  the list.
- **Projects CRUD** — link your GitHub repos, tech stack, and descriptions.
- **Job ↔ Project linking** — many-to-many, per user, inline picker on the
  job detail page.
- **AI analysis (Gemini)** — server-side call, structured JSON response,
  match score 0–100, strengths, missing keywords, ATS-friendly CV bullets,
  cover-letter draft.
- **Analytics** — total / active / interview / offer / response rate /
  monthly applications chart and status distribution.
- **Dashboard** — recent jobs, upcoming deadlines, top KPIs.
- **Empty / loading / error states** everywhere.
- **Dark-mode-ready theme tokens** via Tailwind CSS variables.

---

## Tech stack

| Layer        | Choice                                              |
| ------------ | --------------------------------------------------- |
| Framework    | Next.js 16 (App Router) + React 19                  |
| Language     | TypeScript (strict)                                 |
| Styling      | Tailwind CSS 4 + shadcn/ui primitives               |
| Auth         | Clerk (`@clerk/nextjs`)                             |
| Database     | PostgreSQL                                          |
| ORM          | Prisma 6                                            |
| Forms        | React Hook Form + Zod resolver                      |
| AI           | Google Gemini (`gemini-2.0-flash`) via REST         |
| Hosting      | Vercel-friendly                                     |

---

## Architecture overview

```
app/
  page.tsx                    # public landing page
  (auth)/                     # Clerk sign-in & sign-up
  (dashboard)/                # protected by middleware + layout guard
    dashboard/                # KPIs, recent jobs, deadlines
    jobs/                     # list, new, [id] (detail/edit), actions.ts
    projects/                 # list, new, [id] (detail/edit), actions.ts
    analytics/                # charts & distributions
    settings/                 # account & AI integration status
components/
  jobs/, projects/, analytics/, dashboard/, layout/, ui/
lib/
  ai/                         # gemini client, prompt, runAnalysis()
  queries/                    # data-access helpers (jobs, projects, analytics)
  validations/                # Zod schemas
  status.ts, format.ts, auth.ts, prisma.ts
prisma/
  schema.prisma               # Job, Project, JobProject, AiAnalysis, Reminder
```

Key principles:

- **All mutations are Server Actions** — no API routes needed.
- **All queries enforce `userId`** at the SQL layer (`where: { userId }`).
- **AI key is server-only** — never exposed via `NEXT_PUBLIC_*`.
- **No extra runtime deps for AI** — raw `fetch` against Gemini REST.

---

## Screenshots

> _Add your own screenshots here once deployed._
> Recommended: dashboard, jobs list, job detail with AI analysis, projects, analytics.

```
docs/screenshots/dashboard.png
docs/screenshots/job-detail.png
docs/screenshots/ai-analysis.png
docs/screenshots/analytics.png
```

---

## Getting started

### 1. Prerequisites

- Node.js 20+
- pnpm (recommended) or npm
- PostgreSQL 14+ (local or hosted, e.g. Neon / Supabase / Railway)
- A free Clerk account and a Gemini API key

### 2. Install

```bash
pnpm install
```

### 3. Configure environment

```bash
cp .env.example .env
# then edit .env and fill in DATABASE_URL, Clerk keys, GEMINI_API_KEY
```

See `.env.example` for the full list.

### 4. Database setup

```bash
pnpm prisma migrate dev      # creates tables and applies migrations
pnpm prisma generate         # regenerate the Prisma client (also runs on install)
```

Optional:

```bash
pnpm prisma studio           # GUI to browse your data
```

### 5. Run

```bash
pnpm dev
```

Open <http://localhost:3000>.

---

## AI feature

When the user clicks **Generate Analysis** on a job:

1. The Server Action verifies job ownership via Clerk `userId`.
2. The job (title, company, description) and **only the linked projects**
   (name, description, tech stack) are sent to `runAnalysis()`.
3. `runAnalysis()` builds a prompt asking for strict JSON, calls Gemini with
   `responseMimeType: application/json`, parses + validates the response with
   Zod, and returns a typed `AnalysisResult`.
4. The result is upserted into `AiAnalysis` (1-to-1 with `Job`) so the latest
   analysis is always available without re-spending tokens.

If `GEMINI_API_KEY` is missing, the panel shows
`"AI analysis is unavailable because GEMINI_API_KEY is not configured."` and
the rest of the app keeps working.

---

## Deployment checklist

- [ ] `DATABASE_URL` points to a production Postgres (e.g. Neon / Supabase).
- [ ] Run `pnpm prisma migrate deploy` against the production DB.
- [ ] Set Clerk **production** keys in the host's environment.
- [ ] Set `GEMINI_API_KEY` (server-only).
- [ ] Set `NEXT_PUBLIC_APP_URL` to the deployed origin.
- [ ] Add the deployed origin to Clerk's allowed redirect URLs.
- [ ] Test a full flow: sign up → add job → add project → link → generate
      analysis → analytics shows the new application.

---

## Future improvements

- Auto-fetch GitHub README to seed `Project.description`.
- Reminder emails (Resend) for upcoming deadlines.
- CSV import / export of the job table.
- Per-user candidate profile included in the AI prompt.
- Public share-link for a job's analysis (read-only).

---

## Portfolio pitch

ApplyFlow AI is the project I built to ship a complete, production-shaped
SaaS slice in one repo: authenticated multi-tenant data, server-actions-only
mutations, a typed Prisma layer, real charts off real data, and a useful AI
integration whose cost and key never leave the server. It's the application
I wish existed during my own job search.

---

## License

MIT. Use it, fork it, submit PRs.
