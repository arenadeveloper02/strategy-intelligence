"use client"

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, HeartPulse } from 'lucide-react';
import type {
  AuthMode,
  ConnectionSettings,
  FinalOutput,
  RunPhase,
  StrategyFormInput,
} from '@/lib/types';
import {
  ApiError,
  MAX_WAIT_MS,
  fetchOutput,
  fetchStatus,
  isCompleteStatus,
  isFailedStatus,
  isValidEmail,
  isValidUrl,
  sleep,
  startRun,
} from '@/lib/simApi';
import { logReportRun } from '@/lib/actions';
import ConnectionCard from '@/components/ConnectionCard';
import StrategyForm from '@/components/StrategyForm';
import ProgressPanel from '@/components/ProgressPanel';
import ReportView from '@/components/ReportView';

const DEFAULT_BASE_URL =
  'https://agent.thearena.ai/api/workflows/bfb13140-ebef-4be9-a441-1eff11e6d1ea/execute';

const EMPTY_FORM: StrategyFormInput = {
  company_name: '',
  website_url: '',
  locations: '',
  vertical: '',
  priority_service_lines: '',
  competitors: '',
  budget_tier: '',
  recipient_email: '',
};

export default function StrategyAppClient() {
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URL);
  const [apiKey, setApiKey] = useState('');
  const [authMode, setAuthMode] = useState<AuthMode>('x-api-key');
  const [headerName, setHeaderName] = useState('X-API-Key');
  const [form, setForm] = useState<StrategyFormInput>(EMPTY_FORM);
  const [phase, setPhase] = useState<RunPhase>('form');
  const [statusText, setStatusText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<FinalOutput | null>(null);

  const runTokenRef = useRef(0);
  const startTimeRef = useRef(0);
  const deadlineRef = useRef(0);
  const connRef = useRef<ConnectionSettings | null>(null);
  const currentRunRef = useRef<{ id: string; statusUrl: string | null } | null>(null);

  useEffect(() => {
    if (phase !== 'running' && phase !== 'timeout') return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const connectionReady = apiKey.trim().length > 0 && isValidUrl(baseUrl.trim());
  const requiredFilled = [
    form.company_name,
    form.website_url,
    form.locations,
    form.vertical,
    form.priority_service_lines,
  ].every((field) => field.trim().length > 0);
  const formValid =
    requiredFilled &&
    isValidUrl(form.website_url.trim()) &&
    (form.recipient_email.trim().length === 0 || isValidEmail(form.recipient_email.trim()));
  const canSubmit = connectionReady && formValid;

  function friendlyError(err: unknown): string {
    console.error('Workflow error', err);
    if (err instanceof ApiError) {
      if (err.status === 401 || err.status === 403) {
        return `Check your API key — the server rejected the credentials (HTTP ${err.status}).`;
      }
      return `The server responded with an error (HTTP ${err.status}). Verify the API Base URL and endpoint paths.`;
    }
    if (err instanceof TypeError) {
      return 'Network error — check the API Base URL and your internet connection, then try again.';
    }
    return 'Something unexpected went wrong. Please try again.';
  }

  function finishRun(output: FinalOutput): void {
    setResult(output);
    setPhase('done');
    void logReportRun(output.company || form.company_name.trim(), 'completed').catch(() => undefined);
  }

  function failRun(message: string): void {
    setErrorMessage(message);
    setPhase('error');
    void logReportRun(form.company_name.trim(), 'failed').catch(() => undefined);
  }

  async function pollLoop(token: number, conn: ConnectionSettings): Promise<void> {
    let delay = 3000;
    let consecutiveFailures = 0;
    for (;;) {
      if (token !== runTokenRef.current) return;
      if (Date.now() > deadlineRef.current) {
        setStatusText('Still running — the safety cap was reached.');
        setPhase('timeout');
        return;
      }
      await sleep(delay);
      if (token !== runTokenRef.current) return;
      const run = currentRunRef.current;
      if (!run) {
        failRun('Lost track of the running job. Please retry.');
        return;
      }
      try {
        const poll = await fetchStatus(conn, run.id, run.statusUrl);
        if (token !== runTokenRef.current) return;
        consecutiveFailures = 0;
        const status = poll.status.toLowerCase();
        setStatusText(`Workflow status: ${status || 'running'}`);
        if (isCompleteStatus(status) || poll.output) {
          let output = poll.output;
          if (!output) {
            output = await fetchOutput(conn, run.id);
          }
          if (token !== runTokenRef.current) return;
          if (output && output.report.trim().length > 0) {
            finishRun(output);
          } else {
            failRun('The run completed, but the report came back empty. Please try again.');
          }
          return;
        }
        if (isFailedStatus(status)) {
          failRun('The workflow run reported a failure. Please review your inputs and try again.');
          return;
        }
      } catch (err) {
        if (token !== runTokenRef.current) return;
        consecutiveFailures += 1;
        console.error('Polling error', err);
        if (consecutiveFailures >= 5) {
          failRun(friendlyError(err));
          return;
        }
      }
      delay = Math.min(10000, Math.round(delay * 1.35));
    }
  }

  async function executeRun(token: number, conn: ConnectionSettings): Promise<void> {
    try {
      const started = await startRun(conn, {
        company_name: form.company_name.trim(),
        website_url: form.website_url.trim(),
        locations: form.locations.trim(),
        vertical: form.vertical.trim(),
        priority_service_lines: form.priority_service_lines.trim(),
        competitors: form.competitors.trim(),
        budget_tier: form.budget_tier,
        recipient_email: form.recipient_email.trim(),
      });
      if (token !== runTokenRef.current) return;
      if (started.output) {
        finishRun(started.output);
        return;
      }
      if (!started.id && !started.statusUrl) {
        failRun('The API did not return a job identifier to poll. Check the endpoint configuration.');
        return;
      }
      currentRunRef.current = { id: started.id ?? '', statusUrl: started.statusUrl };
      setStatusText('Job started — polling for completion…');
      await pollLoop(token, conn);
    } catch (err) {
      if (token !== runTokenRef.current) return;
      failRun(friendlyError(err));
    }
  }

  function handleSubmit(): void {
    if (!canSubmit) return;
    const token = runTokenRef.current + 1;
    runTokenRef.current = token;
    const conn: ConnectionSettings = {
      baseUrl: baseUrl.trim(),
      apiKey: apiKey.trim(),
      authMode,
      headerName: headerName.trim() || 'X-API-Key',
    };
    connRef.current = conn;
    currentRunRef.current = null;
    startTimeRef.current = Date.now();
    deadlineRef.current = Date.now() + MAX_WAIT_MS;
    setElapsed(0);
    setErrorMessage('');
    setResult(null);
    setStatusText('Starting the workflow…');
    setPhase('running');
    void logReportRun(form.company_name.trim(), 'started').catch(() => undefined);
    void executeRun(token, conn);
  }

  function handleCancel(): void {
    runTokenRef.current += 1;
    setStatusText('');
    setPhase('form');
  }

  function handleKeepWaiting(): void {
    const conn = connRef.current;
    if (!conn || !currentRunRef.current) {
      setPhase('form');
      return;
    }
    deadlineRef.current = Date.now() + MAX_WAIT_MS;
    setStatusText('Resumed polling…');
    setPhase('running');
    void pollLoop(runTokenRef.current, conn);
  }

  function handleNewReport(): void {
    runTokenRef.current += 1;
    setResult(null);
    setForm(EMPTY_FORM);
    setErrorMessage('');
    setStatusText('');
    setPhase('form');
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <header className="no-print mb-8 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
          <HeartPulse className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Healthcare Growth Strategist
          </h1>
          <p className="text-sm text-slate-500">
            Audit, benchmark, and generate a prioritized organic-growth strategy.
          </p>
        </div>
      </header>

      {(phase === 'form' || phase === 'error') && (
        <div className="space-y-6">
          {phase === 'error' && errorMessage && (
            <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-500" />
              <div>
                <p className="text-sm font-semibold text-red-800">The run could not be completed</p>
                <p className="mt-1 text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          )}
          <ConnectionCard
            baseUrl={baseUrl}
            apiKey={apiKey}
            authMode={authMode}
            headerName={headerName}
            onBaseUrlChange={setBaseUrl}
            onApiKeyChange={setApiKey}
            onAuthModeChange={setAuthMode}
            onHeaderNameChange={setHeaderName}
          />
          <StrategyForm
            value={form}
            onChange={setForm}
            onSubmit={handleSubmit}
            canSubmit={canSubmit}
            connectionReady={connectionReady}
          />
        </div>
      )}

      {(phase === 'running' || phase === 'timeout') && (
        <ProgressPanel
          elapsedSeconds={elapsed}
          statusText={statusText}
          timedOut={phase === 'timeout'}
          onCancel={handleCancel}
          onKeepWaiting={handleKeepWaiting}
          onRetry={handleSubmit}
        />
      )}

      {phase === 'done' && result && <ReportView result={result} onNewReport={handleNewReport} />}
    </div>
  );
}
