# Repository Summary: strategy-intelligence

> Auto-maintained by Sim Development. Last updated: 2026-07-24T10:22:37.894Z.

## Overview

Healthcare Growth Strategist — generates a prioritized organic-growth strategy report via a hardcoded Sim workflow connection, plus a strategy-brief archive with categorized insights.

**Repository:** `strategy-intelligence`  
**File count:** 34

## Features

- One-click growth strategy generation with hardcoded API connection (no Connection card)
- Optional priority service lines input
- Live progress panel with staged workflow tracking
- Markdown report view with copy, download, and print
- Strategy brief archive with AI-generated categorized insights
- Report run logging to Postgres

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

- **Updated at:** 2026-07-24T10:22:37.894Z
- **Request:** Remove the connections segment totally, and make priority service lines input as optional.

Hardcode API- sk-sim-sSZ64q6IYVmaxO-TTCURWsPWZOcMm-RS
