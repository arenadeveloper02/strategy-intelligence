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

// Extra headers sent only on the async start request. Sim deployments typically
// accept an async execution mode hint; harmless if the API ignores it.
export const RUN_EXTRA_HEADERS: Record<string, string> = {
  'X-Execution-Mode': 'async',
};

export const MAX_WAIT_MS = 15 * 60 * 1000; // overall safety cap (~15 min)
export const POLL_INTERVAL_MS = 5000;

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

// ---------------------------------------------------------------------------
// Result resolution. The API returns the report at the TOP LEVEL as `report`
// (NOT under `data`). When using async polling, the report is nested under
// the job wrapper (usually `output.report`). extractReport checks every
// plausible root and returns the first non-empty report string:
//   roots = [res, res.output, res.result, res.result.output, res.data,
//            res.output.data]
// ---------------------------------------------------------------------------
export function extractReport(res: unknown): FinalOutput | null {
  if (!isRecord(res)) return null;
  const output = isRecord(res.output) ? res.output : null;
  const result = isRecord(res.result) ? res.result : null;
  const resultOutput = result && isRecord(result.output) ? result.output : null;
  const data = isRecord(res.data) ? res.data : null;
  const outputData = output && isRecord(output.data) ? output.data : null;

  const roots: Record<string, unknown>[] = [res];
  if (output) roots.push(output);
  if (result) roots.push(result);
  if (resultOutput) roots.push(resultOutput);
  if (data) roots.push(data);
  if (outputData) roots.push(outputData);

  for (const r of roots) {
    const report = r.report;
    if (typeof report === 'string' && report.trim().length > 0) {
      return {
        report,
        company: typeof r.company === 'string' ? r.company : '',
        file_saved: typeof r.file_saved === 'string' ? r.file_saved : '',
      };
    }
  }
  return null;
}

function extractFinalOutput(value: unknown, depth: number): FinalOutput | null {
  if (depth > 4 || !isRecord(value)) return null;
  // Primary resolver: top-level report, then the known wrapper roots.
  const resolved = extractReport(value);
  if (resolved) return resolved;
  // Fall back to deeper nesting for unusual wrapper envelopes.
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

// ---------------------------------------------------------------------------
// Streaming execution — mirrors the documented curl request:
//   POST {baseUrl} with JSON body including "stream": true and the X-API-Key
//   header. The response is read incrementally (SSE / NDJSON / raw text) and
//   the final report is assembled from streamed chunks or a final JSON event.
// ---------------------------------------------------------------------------

export interface StreamCallbacks {
  isCancelled: () => boolean;
  onChunk?: (receivedChars: number) => void;
}

interface StreamLineResult {
  output: FinalOutput | null;
  text: string;
}

function textFromStreamEvent(value: unknown): string {
  if (!isRecord(value)) return '';
  const directKeys = ['chunk', 'content', 'text'];
  for (const key of directKeys) {
    const candidate = value[key];
    if (typeof candidate === 'string') return candidate;
  }
  const delta = value.delta;
  if (typeof delta === 'string') return delta;
  if (isRecord(delta) && typeof delta.content === 'string') return delta.content;
  const choices = value.choices;
  if (Array.isArray(choices) && choices.length > 0) {
    const first: unknown = choices[0];
    if (isRecord(first)) {
      const d = first.delta;
      if (isRecord(d) && typeof d.content === 'string') return d.content;
    }
  }
  const data = value.data;
  if (isRecord(data)) {
    for (const key of directKeys) {
      const candidate = data[key];
      if (typeof candidate === 'string') return candidate;
    }
  }
  return '';
}

function processStreamLine(line: string): StreamLineResult {
  const trimmed = line.trim();
  if (trimmed.length === 0) return { output: null, text: '' };
  if (
    trimmed.startsWith(':') ||
    trimmed.startsWith('event:') ||
    trimmed.startsWith('id:') ||
    trimmed.startsWith('retry:')
  ) {
    return { output: null, text: '' };
  }
  const payload = trimmed.startsWith('data:') ? trimmed.slice(5).trim() : trimmed;
  if (payload.length === 0 || payload === '[DONE]') return { output: null, text: '' };
  try {
    const parsed: unknown = JSON.parse(payload);
    const output = extractFinalOutput(parsed, 0);
    if (output) return { output, text: '' };
    return { output: null, text: textFromStreamEvent(parsed) };
  } catch {
    // Not JSON. Raw SSE data lines are treated as streamed report text.
    if (trimmed.startsWith('data:')) {
      return { output: null, text: payload + '\n' };
    }
    return { output: null, text: '' };
  }
}

function parseRawStreamText(text: string): FinalOutput | null {
  const trimmed = text.trim();
  if (trimmed.length === 0) return null;
  try {
    const parsed: unknown = JSON.parse(trimmed);
    // Log the real response shape once, right before extracting the report.
    console.log(JSON.stringify(parsed));
    const output = extractFinalOutput(parsed, 0);
    if (output) return output;
    return null;
  } catch {
    // not a JSON document
  }
  if (trimmed.startsWith('{') || trimmed.startsWith('[') || trimmed.startsWith('data:')) {
    return null;
  }
  return { report: trimmed, company: '', file_saved: '' };
}

export async function executeStreamingRun(
  conn: ConnectionSettings,
  body: StrategyFormInput,
  callbacks: StreamCallbacks
): Promise<FinalOutput | null> {
  const url = normalizeBase(conn.baseUrl) + RUN_PATH;
  const res = await fetch(url, {
    method: 'POST',
    headers: buildHeaders(conn),
    body: JSON.stringify({ ...body, stream: true }),
  });
  if (!res.ok && res.status !== 202) {
    throw new ApiError(res.status, 'Failed to start the workflow run');
  }
  const contentType = (res.headers.get('content-type') ?? '').toLowerCase();
  if (contentType.includes('application/json')) {
    let json: unknown = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    // Log the real response shape once, right before extracting the report.
    console.log(JSON.stringify(json));
    return extractFinalOutput(json, 0);
  }
  const reader = res.body ? res.body.getReader() : null;
  if (!reader) {
    let text = '';
    try {
      text = await res.text();
    } catch {
      text = '';
    }
    return parseRawStreamText(text);
  }
  const decoder = new TextDecoder();
  let buffer = '';
  let raw = '';
  let accumulated = '';
  let finalOutput: FinalOutput | null = null;
  for (;;) {
    if (callbacks.isCancelled()) {
      try {
        await reader.cancel();
      } catch {
        // ignore cancellation errors
      }
      return null;
    }
    const { done, value } = await reader.read();
    if (value) {
      const chunkText = decoder.decode(value, { stream: true });
      raw += chunkText;
      buffer += chunkText;
      let newlineIndex = buffer.indexOf('\n');
      while (newlineIndex !== -1) {
        const line = buffer.slice(0, newlineIndex);
        buffer = buffer.slice(newlineIndex + 1);
        const parsedLine = processStreamLine(line);
        if (parsedLine.output) finalOutput = parsedLine.output;
        accumulated += parsedLine.text;
        newlineIndex = buffer.indexOf('\n');
      }
      if (callbacks.onChunk) {
        callbacks.onChunk(Math.max(accumulated.length, raw.length));
      }
    }
    if (done) break;
  }
  buffer += decoder.decode();
  if (buffer.trim().length > 0) {
    const parsedLine = processStreamLine(buffer);
    if (parsedLine.output) finalOutput = parsedLine.output;
    accumulated += parsedLine.text;
  }
  if (finalOutput && finalOutput.report.trim().length > 0) return finalOutput;
  if (accumulated.trim().length > 0) {
    return { report: accumulated, company: body.company_name, file_saved: '' };
  }
  return parseRawStreamText(raw);
}

// ---------------------------------------------------------------------------
// Async start + poll fallback. The start response may already contain the
// report at the top level; otherwise poll the job and read `output.report`
// (or the other wrapper roots) via extractReport.
// ---------------------------------------------------------------------------

export async function startRun(
  conn: ConnectionSettings,
  body: StrategyFormInput
): Promise<StartRunResult> {
  const url = normalizeBase(conn.baseUrl) + RUN_PATH;
  const res = await fetch(url, {
    method: 'POST',
    headers: { ...buildHeaders(conn), ...RUN_EXTRA_HEADERS },
    body: JSON.stringify(body),
  });
  if (!res.ok && res.status !== 202) {
    throw new ApiError(res.status, 'Failed to start the workflow run');
  }
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  // Log the real response shape once, right before extracting the report.
  console.log(JSON.stringify(json));
  const output = extractFinalOutput(json, 0);
  const statusUrlRaw = extractStatusUrl(json);
  return {
    id: extractRunId(json),
    statusUrl: statusUrlRaw ? resolveUrl(statusUrlRaw, conn.baseUrl) : null,
    output,
  };
}

export async function pollRun(
  conn: ConnectionSettings,
  id: string,
  statusUrl: string | null
): Promise<PollResult> {
  const url = statusUrl ?? normalizeBase(conn.baseUrl) + STATUS_PATH.replace('{id}', id);
  const res = await fetch(url, { headers: buildHeaders(conn) });
  if (!res.ok) {
    throw new ApiError(res.status, 'Failed to poll the run status');
  }
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  // Log the real response shape once, right before extracting the report.
  console.log(JSON.stringify(json));
  const status = extractStatus(json) ?? 'unknown';
  const output = extractFinalOutput(json, 0);
  return { status, output };
}

export async function fetchOutput(
  conn: ConnectionSettings,
  id: string
): Promise<FinalOutput | null> {
  const url = normalizeBase(conn.baseUrl) + OUTPUT_PATH.replace('{id}', id);
  const res = await fetch(url, { headers: buildHeaders(conn) });
  if (!res.ok) return null;
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    return null;
  }
  // Log the real response shape once, right before extracting the report.
  console.log(JSON.stringify(json));
  return extractFinalOutput(json, 0);
}

// Polls until the job reports a terminal status. IMPORTANT: never treat a
// missing report as "empty" while the job is still running — only a COMPLETE
// status with no extractable report should surface the empty-report warning
// (this function returns null in that case; the caller decides what to show).
export async function waitForCompletion(
  conn: ConnectionSettings,
  start: StartRunResult,
  isCancelled: () => boolean
): Promise<FinalOutput | null> {
  if (start.output && start.output.report.trim().length > 0) return start.output;
  if (!start.id && !start.statusUrl) return null;
  const deadline = Date.now() + MAX_WAIT_MS;
  while (Date.now() < deadline) {
    if (isCancelled()) return null;
    const poll = await pollRun(conn, start.id ?? '', start.statusUrl);
    if (poll.output && poll.output.report.trim().length > 0) return poll.output;
    if (isFailedStatus(poll.status)) {
      throw new ApiError(500, `The run finished with status "${poll.status}".`);
    }
    if (isCompleteStatus(poll.status)) {
      // Status is complete but the poll payload had no report — try the
      // dedicated output endpoint once as a fallback.
      if (start.id) {
        const output = await fetchOutput(conn, start.id);
        if (output && output.report.trim().length > 0) return output;
      }
      return null;
    }
    // Still running — keep polling; do NOT surface an empty-report warning here.
    await sleep(POLL_INTERVAL_MS);
  }
  return null;
}
