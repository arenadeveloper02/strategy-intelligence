# Repository Summary: strategy-intelligence

> Auto-maintained by Sim Development. Last updated: 2026-07-27T09:31:59.147Z.

## Overview

Healthcare growth strategy intelligence app: generates prioritized organic-growth strategy reports via a streaming workflow API, plus stored strategy briefs with categorized insights.

**Repository:** `strategy-intelligence`  
**File count:** 34

## Features

- Streaming growth-strategy report generation
- Nested data.report result parsing for completed runs
- Markdown report rendering with copy/download/print
- Strategy brief CRUD with categorized insights
- Report run logging via Prisma

## Tech Stack

- Next.js ^15.3.3 (App Router)
- React ^19.0.0
- Tailwind CSS v3
- TypeScript
- Prisma + PostgreSQL (Neon on Vercel)

## Infrastructure

- **DATABASE_URL:** set on Vercel when Neon is connected — do not commit real credentials

## Routes & Pages

- `/` — `app/page.tsx`
- `/briefs/:id` — `app/briefs/[id]/page.tsx`
- `/new` — `app/new/page.tsx`

## Database Models

- `StrategyBrief`
- `Insight`
- `ReportRun`

## File Inventory

### App pages

- `app/briefs/[id]/page.tsx`
- `app/error.tsx`
- `app/globals.css`
- `app/layout.tsx`
- `app/new/page.tsx`
- `app/not-found.tsx`
- `app/page.tsx`

### Components

- `components/BriefDetailClient.tsx`
- `components/BriefFormClient.tsx`
- `components/BriefListClient.tsx`
- `components/ConnectionCard.tsx`
- `components/Footer.tsx`
- `components/MarkdownReport.tsx`
- `components/Navbar.tsx`
- `components/ProgressPanel.tsx`
- `components/ReportView.tsx`
- `components/StrategyAppClient.tsx`
- `components/StrategyForm.tsx`

### Libraries

- `lib/actions.ts`
- `lib/config.ts`
- `lib/prisma.ts`
- `lib/simApi.ts`
- `lib/types.ts`
- `prisma/schema.prisma`

### Config

- `.env.example`
- `next-env.d.ts`
- `next.config.ts`
- `package-lock.json`
- `package.json`
- `postcss.config.mjs`
- `tailwind.config.ts`
- `tsconfig.json`

### Other

- `README.md`
- `REPO_SUMMARY.md`

## Complete File Index

- `.env.example`
- `README.md`
- `REPO_SUMMARY.md`
- `app/briefs/[id]/page.tsx`
- `app/error.tsx`
- `app/globals.css`
- `app/layout.tsx`
- `app/new/page.tsx`
- `app/not-found.tsx`
- `app/page.tsx`
- `components/BriefDetailClient.tsx`
- `components/BriefFormClient.tsx`
- `components/BriefListClient.tsx`
- `components/ConnectionCard.tsx`
- `components/Footer.tsx`
- `components/MarkdownReport.tsx`
- `components/Navbar.tsx`
- `components/ProgressPanel.tsx`
- `components/ReportView.tsx`
- `components/StrategyAppClient.tsx`
- `components/StrategyForm.tsx`
- `lib/actions.ts`
- `lib/config.ts`
- `lib/prisma.ts`
- `lib/simApi.ts`
- `lib/types.ts`
- `next-env.d.ts`
- `next.config.ts`
- `package-lock.json`
- `package.json`
- `postcss.config.mjs`
- `prisma/schema.prisma`
- `tailwind.config.ts`
- `tsconfig.json`

## Latest Change

- **Updated at:** 2026-07-27T09:31:59.147Z
- **Request:** UPDATE the result-parsing logic only. Do not change the form, styling, or layout.

The problem: the app shows "report came back empty" even when the run succeeds, because it reads the report from the wrong path. The workflow returns the report NESTED under a "data" object, not at the top level.

Change how the completed job result is read. Replace the current report-reading code with this resolver:

  const out = pollResponse.output ?? pollResponse.result ?? pollResponse;
  const data = out.data ?? out;
  const report = data.report;         // full markdown report
  const company = data.company;       // company name
  const fileSaved = data.file_saved;  // saved filename

Rules:
- Read the report from data.report. Do NOT read response.report or response.output.report at the top level.
- Only show the "report came back empty" warning if data.report is a genuinely empty string or missing AFTER the job status is "completed". Never show it while still polling.
- Render data.report as markdown. Use company for the title and fileSaved for the download filename.

Everything else stays exactly as-is.
