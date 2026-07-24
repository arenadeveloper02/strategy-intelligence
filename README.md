<<<<<<< HEAD
# Healthcare Growth Strategist

A polished single-page frontend for a deployed "Healthcare Growth Strategist" API workflow. Enter a client's details, kick off the multi-stage AI pipeline asynchronously, watch live progress while it audits the site and benchmarks competitors (~6–9 minutes), then read the returned markdown growth-strategy report in a clean, print-ready layout.

## Features

- Runtime API key entry (password field with show/hide) — the key lives in memory only and is never hardcoded, stored, or logged
- Configurable API Base URL and auth header style (`X-API-Key` custom header or `Authorization: Bearer`)
- Async lifecycle: start POST → adaptive polling (3s backing off to 10s) → output fetch fallback, with a ~15-minute safety cap plus Keep Waiting / Retry
- Live progress panel with elapsed timer and a heuristic 4-stage stepper (Site Discovery → Competitor Benchmark → Idea Engine → Synthesis & Report)
- GFM markdown rendering with mobile-scrollable roadmap tables and styled `[Strategic]` / `[Tactical]` badges
- Copy Markdown, Download `.md` (uses the returned `file_saved` name), Print / Save as PDF, and New Report (keeps connection settings)
- Server-side run logging (start/complete/fail) via Prisma + Neon Postgres

## Where the API key goes

Open the app and paste your Sim API key into the **Connection** card's *API Key* field at runtime. The *API Base URL* field is prefilled with the deployed workflow execute endpoint and is editable. The key is only held in React state — refreshing the page clears it.

## Endpoint path templates

The three endpoint templates live at the top of `lib/simApi.ts` — adjust these to match the Sim async API for your deployment:

| Constant | Default | Purpose |
| --- | --- | --- |
| `RUN_PATH` | `''` (POST `{baseUrl}`) | Starts the job; the response's `executionId` / `id` / `taskId` / `runId` (or a `Location` / status URL) is used for polling |
| `STATUS_PATH` | `/status/{id}` (GET) | Returns run status (`running` / `completed` / `failed` …) |
| `OUTPUT_PATH` | `/output/{id}` (GET) | Fallback fetch for the final output if the status payload doesn't embed it |

The final structured output is expected to contain `report` (markdown), `company`, and `file_saved`.

## Tech stack

- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS 3
- react-markdown + remark-gfm for GFM table rendering
- Prisma + Neon Postgres (run logging)

## Local setup

```bash
npm install
cp .env.example .env   # set DATABASE_URL to your Postgres connection string
npm run dev
```

The build script runs `prisma generate && prisma db push && next build`, so a valid `DATABASE_URL` is required for production builds.

## Deploy

Deploy to Vercel with a Neon Postgres database attached — `DATABASE_URL` is injected automatically when the database is connected to the project.
=======
# Strategy Intelligence

A strategy intelligence platform where teams submit strategic briefs and receive categorized strategic insights (Market, Growth, Risk, Operations), persisted in Postgres via Prisma.

## Features

- Strategic brief intake with two required segments: Company Profile and Strategic Objectives
- **Priority Service Lines input is optional** — briefs can be created without it
- **Connections segment has been removed entirely** from the intake flow
- AI-assisted insight generation using the Sim API (key configured in `lib/config.ts`) with a resilient local fallback so briefs always get insights
- Dashboard with brief list, insight counts, industry coverage stats, and delete support
- Brief detail page with categorized insights and one-click regeneration

## Tech Stack

- Next.js 15 (App Router) + React 19
- TypeScript (strict)
- Tailwind CSS v3
- Prisma + Neon Postgres
- lucide-react icons

## Local Setup

1. Copy `.env.example` to `.env` and set `DATABASE_URL` to your Postgres connection string.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the dev server:
   ```bash
   npx prisma db push
   npm run dev
   ```

## Deploy

On Vercel with Neon, `DATABASE_URL` is injected automatically once the database is connected. The build script runs `prisma generate && prisma db push && next build`.

## Notes

- The external API key is hardcoded in `lib/config.ts` (server-side only) per project requirement. Rotate the key there if needed.
>>>>>>> 6f918cf (Initial commit)
