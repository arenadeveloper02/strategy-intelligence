# Repository Summary: strategy-intelligence

> Auto-maintained by Sim Development. Last updated: 2026-07-27T10:13:43.451Z.

## Overview

Healthcare growth strategy generator: run the Sim workflow with streaming, render the markdown report, and manage strategy briefs with categorized insights backed by Postgres.

**Repository:** `strategy-intelligence`  
**File count:** 34

## Features

- Streaming workflow execution with progress stages
- Top-level and job-wrapper report resolution (report / output.report / result.output.report)
- Markdown report rendering with copy, download, and print
- Strategy briefs with categorized insights (Prisma + Neon Postgres)
- Run logging via server actions

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

- **Updated at:** 2026-07-27T10:13:43.451Z
- **Request:** UPDATE result-parsing only. Do not change form, styling, or layout.

The API returns the report at the TOP LEVEL as `report` (NOT under `data`). If using async polling, it is nested under the job wrapper (usually `output.report`). Use this resolver, which checks every level and returns the first non-empty report string:

  function extractReport(res) {
    const roots = [res, res?.output, res?.result, res?.result?.output, res?.data, res?.output?.data];
    for (const r of roots) {
      if (r && typeof r.report === "string" && r.report.trim()) {
        return { report: r.report, company: r.company, fileSaved: r.file_saved };
      }
    }
    return null;
  }

Rules:
- console.log(JSON.stringify(res)) ONCE right before calling extractReport, so the real shape is visible in the browser console.
- Only show the "report came back empty" warning when extractReport returns null AND the run/job status is complete. Never during polling.
- Render found.report as markdown; use found.company for the title and found.fileSaved for the download name.
