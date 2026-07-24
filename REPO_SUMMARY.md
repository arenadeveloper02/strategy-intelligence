# Repository Summary: Healthcare Growth Strategist

> Auto-maintained by Sim Development. Last updated: 2026-07-24T07:55:53.033Z.

## Overview

A polished single-page frontend for a deployed Healthcare Growth Strategist API workflow: collects client inputs, starts the job asynchronously, polls for completion with a live progress stepper, and renders the returned markdown growth-strategy report in a clean, print-ready layout.

**Repository:** `strategy-intelligence`  
**File count:** 26

## Features

- Runtime-provided API key (password field with show/hide) kept in memory only — never hardcoded or logged
- Configurable API Base URL and auth header style (X-API-Key custom header or Authorization: Bearer)
- Async run lifecycle: start POST, adaptive polling (3s backing off to 10s), output fetch fallback, 15-minute safety cap with Keep Waiting / Retry
- Validated form: required fields, URL validation, optional email validation, collapsible advanced options
- Live progress panel with elapsed timer and heuristic 4-stage pipeline stepper
- GFM markdown report rendering with mobile-scrollable tables and [Strategic]/[Tactical] badge styling
- Copy Markdown, Download .md (uses file_saved), Print / Save as PDF, and New Report (keeps connection settings)
- Friendly, non-technical error messages for auth, network, run-failure, empty-report, and timeout cases
- Server-side run logging via Prisma (Neon Postgres) — no browser storage used

## Tech Stack

- Next.js ^15.3.3 (App Router)
- React ^19.0.0
- Tailwind CSS v3
- TypeScript
- Prisma + PostgreSQL (Neon on Vercel)

## Infrastructure

- **Neon project ID:** `late-thunder-79759644` — managed by Sim Development; do not delete or replace
- **DATABASE_URL:** set on Vercel when Neon is connected — do not commit real credentials

## Routes & Pages

- `/` — `app/page.tsx`

## Database Models

- `ReportRun`

## File Inventory

### App pages

- `app/error.tsx`
- `app/globals.css`
- `app/layout.tsx`
- `app/not-found.tsx`
- `app/page.tsx`

### Components

- `components/ConnectionCard.tsx`
- `components/MarkdownReport.tsx`
- `components/ProgressPanel.tsx`
- `components/ReportView.tsx`
- `components/StrategyAppClient.tsx`
- `components/StrategyForm.tsx`

### Libraries

- `lib/actions.ts`
- `lib/prisma.ts`
- `lib/simApi.ts`
- `lib/types.ts`
- `prisma/schema.prisma`

### Config

- `.env.example`
- `.gitignore`
- `next-env.d.ts`
- `next.config.ts`
- `package.json`
- `postcss.config.mjs`
- `tailwind.config.ts`
- `tsconfig.json`

### Other

- `README.md`
- `REPO_SUMMARY.md`

## Complete File Index

- `.env.example`
- `.gitignore`
- `README.md`
- `REPO_SUMMARY.md`
- `app/error.tsx`
- `app/globals.css`
- `app/layout.tsx`
- `app/not-found.tsx`
- `app/page.tsx`
- `components/ConnectionCard.tsx`
- `components/MarkdownReport.tsx`
- `components/ProgressPanel.tsx`
- `components/ReportView.tsx`
- `components/StrategyAppClient.tsx`
- `components/StrategyForm.tsx`
- `lib/actions.ts`
- `lib/prisma.ts`
- `lib/simApi.ts`
- `lib/types.ts`
- `next-env.d.ts`
- `next.config.ts`
- `package.json`
- `postcss.config.mjs`
- `prisma/schema.prisma`
- `tailwind.config.ts`
- `tsconfig.json`

## Latest Change

- **Updated at:** 2026-07-24T07:55:53.033Z
- **Request:** Build a polished, single-page web app that serves as the frontend for a deployed "Healthcare Growth Strategist" API workflow. It collects inputs, kicks off the job asynchronously, polls for completion, then renders the returned growth-strategy report.

=== PURPOSE ===
A healthcare marketing analyst enters a client's details, submits, and watches live progress while a multi-stage AI pipeline audits the site, benchmarks competitors, and generates a prioritized organic-growth strategy (~6–9 minutes). When done, they read the returned markdown report in a clean, print-ready layout.

=== API KEY (USER-PROVIDED AT RUNTIME) ===
- Render a visible "API Key" input field in the UI (password-type with a show/hide toggle). The user pastes their Sim API key there — do NOT hardcode it and do NOT read it from build-time env.
- Persist the entered key only in memory (and optionally sessionStorage so it survives a refresh within the session). Never log it.
- Also render an "API Base URL" field (prefilled-editable) so the endpoint is configurable.
- Send the key in the request header the Sim API expects — make the header name configurable with a sensible default (X-API-Key), and support "Authorization: Bearer <key>" as an alternate the user can toggle.
- Disable Submit until both API Key and API Base URL are filled and the form is valid.

=== ASYNC EXECUTION FLOW (POLLING, NOT ONE LONG REQUEST) ===
Do not hold a single multi-minute fetch. Implement this lifecycle:
1. START: POST to the async-run endpoint with the input body (below). Expect a response containing an execution/job identifier (handle common shapes: executionId | id | taskId | runId — pick whichever is present). If the API instead streams or returns a 202 with a status URL / Location header, follow that URL.
2. POLL: repeatedly GET the run-status endpoint using that identifier on an interval (start ~3s, back off toward ~10s). Read a status field (handle: running/pending/queued vs. completed/success vs. failed/error). Keep polling until terminal.
3. RESULT: when complete, read the output. The final structured output has fields: report, company, file_saved (described below). If the status payload doesn't embed the output, fetch it from the run-details/output endpoint using the same identifier.
- Make the three endpoint path templates configurable constants near the top so they're easy to adjust:
    RUN_PATH        (default: POST {baseUrl}/{workflow-run})       -> starts the job, returns an id
    STATUS_PATH     (default: GET  {baseUrl}/status/{id})          -> returns status
    OUTPUT_PATH     (default: GET  {baseUrl}/output/{id})          -> returns final output (fallback)
  Add a short comment: "Adjust these to match the Sim async API for this deployment."
- Add an overall safety cap (e.g. stop polling after ~15 min) with a graceful timeout message and a "Keep waiting" / "Retry" option that does NOT lose the entered inputs or API key.

=== REQUEST BODY (maps to the Start trigger schema) ===
- company_name (string, REQUIRED)
- website_url (string, REQUIRED) — validate it's a URL
- locations (string, REQUIRED) — city/region or service area
- vertical (string, REQUIRED) — healthcare vertical, e.g. "Mental Health", "Dental", "Med Spa"
- priority_service_lines (string, REQUIRED) — comma-separated service lines
- competitors (string, OPTIONAL) — comma-separated URLs; leave blank to auto-discover
- budget_tier (string, OPTIONAL) — dropdown: "" (All tiers) / Low / Mid / High
- recipient_email (string, OPTIONAL) — if provided, the workflow also emails the report

=== RESPONSE / FINAL OUTPUT (structured JSON) ===
- report (string) — the full growth-strategy report in MARKDOWN
- company (string) — echoes the company name
- file_saved (string) — the saved .md filename

=== FORM UI ===
- Clean medical/professional aesthetic: calm blues/teals, generous whitespace, rounded cards, accessible contrast, mobile responsive.
- Card "Connection": API Base URL, API Key (password + show/hide), header-style toggle (X-API-Key vs Bearer).
- Card "Generate Growth Strategy":
  - Required: Company Name, Website URL, Location(s), Healthcare Vertical, Priority Service Lines.
  - Collapsible "Advanced options": Competitors (helper: "Leave blank to auto-discover"), Budget Tier (dropdown), Recipient Email (helper: "Optional — emails the report when set").
- Client-side validation: required non-empty, website_url valid URL, recipient_email valid email if filled.

=== PROGRESS UI (while polling) ===
- Prominent progress panel with an elapsed timer and a note: "This typically takes 6–9 minutes — you can keep this tab open."
- A stepper reflecting the real pipeline stages: "Site Discovery → Competitor Benchmark → Idea Engine → Synthesis & Report". Advance the stepper heuristically over elapsed time (indeterminate is fine) since the status endpoint may only report running/complete.
- Show the current polling status text and a "Cancel" that stops polling and returns to the form (inputs + key retained).

=== RESULTS VIEW ===
- Render report (markdown) with a GFM-capable renderer: headings, tables, lists, emphasis. The report contains a ranked roadmap TABLE with columns: Idea | Strategic/Tactical | Source Pool | Impact | Effort | Time-to-Value | Cost Tier | Compliance Flag — make tables scroll nicely on mobile.
- Header bar shows company (from response) and a subtle badge with file_saved.
- Style the [Strategic] and [Tactical] tags that appear in item titles: [Strategic] = primary/teal badge, [Tactical] = neutral/gray badge, so the strategy-led balance is visually obvious.
- Action buttons: "Copy Markdown", "Download .md" (use file_saved as filename), "Print / Save as PDF" (print-optimized CSS), and "New Report" (reset form but KEEP the API key + base URL).

=== ERRORS ===
- Friendly, non-technical messages for: missing/invalid key (401/403 -> "Check your API key"), network failure, non-2xx on start, failed run status, empty report, and poll timeout. Log technical detail to console only. Never render or log the API key.

=== TECH ===
- React + TypeScript, modern component style, a markdown library with GFM table support. Single deployable client app calling the Sim API directly. Include a short README explaining the three endpoint path templates and where the user pastes the API key at runtime.


API Key- sk-sim-sSZ64q6IYVmaxO-TTCURWsPWZOcMm-RS

Link- https://agent.thearena.ai/api/workflows/bfb13140-ebef-4be9-a441-1eff11e6d1ea/execute
