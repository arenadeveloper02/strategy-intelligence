# Repository Summary: strategy-intelligence

> Auto-maintained by Sim Development. Last updated: 2026-07-24T10:47:07.660Z.

## Overview

Healthcare growth strategy generator that calls the Sim workflow execute endpoint with streaming enabled, renders the markdown report, and stores strategy briefs with categorized insights in Postgres.

**Repository:** `strategy-intelligence`  
**File count:** 34

## Features

- Streaming workflow execution via POST with stream:true against the Sim execute endpoint
- Hardcoded X-API-Key authentication matching the provided curl request
- Live progress panel with elapsed timer, stage indicators, and streamed-character status
- Markdown report rendering with copy, download, and print actions
- Strategy brief CRUD with categorized insights persisted in Neon Postgres

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

- **Updated at:** 2026-07-24T10:47:07.660Z
- **Request:** Use the Below Curl Request:
curl -X POST \
  -H "X-API-Key: $SIM_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"company_name":"example","website_url":"example","locations":"example","vertical":"example","competitors":"example","budget_tier":"example","priority_service_lines":"example","recipient_email":"example","stream":true}' \
  https://agent.thearena.ai/api/workflows/bfb13140-ebef-4be9-a441-1eff11e6d1ea/execute



Here is he API Key: sk-sim-Ef4OiRRFe5lN_P1oWWdvCIyrPhPkd7X3 


You can hardcode the API Key
