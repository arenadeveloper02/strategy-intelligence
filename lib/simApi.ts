import type { ConnectionSettings, FinalOutput, PollResult, StartRunResult, StrategyFormInput } from '@/lib/types';

// ---------------------------------------------------------------------------
// Adjust these to match the Sim async API for this deployment.
// RUN_PATH is appended to the base URL for the initial POST (empty string means
// the base URL itself IS the run endpoint). STATUS_PATH and OUTPUT_PATH use the
// {id} placeholder for the run identifier returned by the start call.
// ---------------------------------------------------------------------------
export const RUN_PATH = ''; // POST {baseUrl}{RUN_PATH} -> starts the job, returns an id
export const STATUS_PATH = '/status/{id}'; // GET {baseUrl}/status/{id} -> returns status
export const OUTPUT_PATH = '/output/{id}'; // GET {baseUrl}/output/{id} -> final output (fallback)

// Extra headers sent only on the start request. Sim deployments typically
// accept an async execution mode hint; harmless if the API ignores it.
export const RUN_EXTRA_HEADERS: Record<string, string> = {
  'X-Execution-Mode': 'async',
};

export const MAX_WAIT_MS = 15 * 60 * 1000; // overall polling safety cap (~15 min)

const COMPLETE_STATUSES = ['completed', 'complete', 'success', 'succeeded', 'finished', 'done'];
const FAILED_STATUSES = ['failed', 'error', 'errored', 'cancelled', 'canceled', 'timeout', 'timed_out'];

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export function isCompleteStatus(status: string): boolean {
  return COMPLETE_STATUSES.includes(status);
}

export function isFailedStatus(status: string): boolean {
  return FAILED_STATUSES.includes(status);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isValidUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeBase(baseUrl: string): string {
  return baseUrl.trim().replace(/\/+$/, '');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function buildHeaders(conn: ConnectionSettings): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (conn.authMode === 'bearer') {
    headers['Authorization'] = `Bearer ${conn.apiKey}`;
  } else {
    headers[conn.headerName || 'X-API-Key'] = conn.apiKey;
  }
  return headers;
}

function extractFinalOutput(value: unknown, depth: number): FinalOutput | null {
  if (depth > 4 || !isRecord(value)) return null;
  if (typeof value.report === 'string' && value.report.length > 0) {
    return {
      report: value.report,
      company: typeof value.company === 'string' ? value.company : '',
      file_saved: typeof value.file_saved === 'string' ? value.file_saved : '',
    };
  }
  const nestedKeys = ['output', 'outputs', 'result', 'data', 'response'];
  for (const key of nestedKeys) {
    const found = extractFinalOutput(value[key], depth + 1);
    if (found) return found;
  }
  return null;
}

function extractRunId(value: unknown, depth = 0): string | null {
  if (depth > 3 || !isRecord(value)) return null;
  const idKeys = ['executionId', 'execution_id', 'taskId', 'task_id', 'runId', 'run_id', 'jobId', 'job_id', 'id'];
  for (const key of idKeys) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.length > 0) return candidate;
  }
  const nestedKeys = ['data', 'execution', 'result', 'run', 'task'];
  for (const key of nestedKeys) {
    const nested = extractRunId(value[key], depth + 1);
    if (nested) return nested;
  }
  return null;
}

function extractStatusUrl(value: unknown): string | null {
  if (!isRecord(value)) return null;
  const urlKeys = ['statusUrl', 'status_url', 'pollUrl', 'poll_url'];
  for (const key of urlKeys) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.length > 0) return candidate;
  }
  const links = value.links;
  if (isRecord(links) && typeof links.status === 'string' && links.status.length > 0) {
    return links.status;
  }
  return null;
}

function extractStatus(value: unknown, depth = 0): string | null {
  if (depth > 3 || !isRecord(value)) return null;
  const statusKeys = ['status', 'state', 'executionStatus', 'runStatus'];
  for (const key of statusKeys) {
    const candidate = value[key];
    if (typeof candidate === 'string' && candidate.length > 0) return candidate.toLowerCase();
  }
  const nestedKeys = ['data', 'execution', 'result', 'run'];
  for (const key of nestedKeys) {
    const nested = extractStatus(value[key], depth + 1);
    if (nested) return nested;
  }
  return null;
}

function resolveUrl(candidate: string, baseUrl: string): string {
  try {
    return new URL(candidate, normalizeBase(baseUrl) + '/').toString();
  } catch {
    return candidate;
  }
}

export async function startRun(
  conn: ConnectionSettings,
  body: StrategyFormInput
): Promise<StartRunResult> {
  const url = normalizeBase(conn.baseUrl) + RUN_PATH;
  const headers = { ...buildHeaders(conn), ...RUN_EXTRA_HEADERS };
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  const location = res.headers.get('Location') ?? res.headers.get('location');
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  if (!res.ok && res.status !== 202) {
    throw new ApiError(res.status, 'Failed to start the workflow run');
  }
  const output = extractFinalOutput(json, 0);
  const id = extractRunId(json);
  const rawStatusUrl = extractStatusUrl(json) ?? location;
  const statusUrl = rawStatusUrl ? resolveUrl(rawStatusUrl, conn.baseUrl) : null;
  return { id, statusUrl, output };
}

export async function fetchStatus(
  conn: ConnectionSettings,
  id: string,
  statusUrl: string | null
): Promise<PollResult> {
  const url =
    statusUrl && statusUrl.length > 0
      ? statusUrl
      : normalizeBase(conn.baseUrl) + STATUS_PATH.replace('{id}', encodeURIComponent(id));
  const res = await fetch(url, { headers: buildHeaders(conn) });
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  if (!res.ok && res.status !== 202) {
    throw new ApiError(res.status, 'Status check failed');
  }
  const status = extractStatus(json) ?? 'running';
  const output = extractFinalOutput(json, 0);
  return { status, output };
}

export async function fetchOutput(
  conn: ConnectionSettings,
  id: string
): Promise<FinalOutput | null> {
  if (!id) return null;
  const url = normalizeBase(conn.baseUrl) + OUTPUT_PATH.replace('{id}', encodeURIComponent(id));
  try {
    const res = await fetch(url, { headers: buildHeaders(conn) });
    if (!res.ok) return null;
    const json: unknown = await res.json();
    return extractFinalOutput(json, 0);
  } catch {
    return null;
  }
}
