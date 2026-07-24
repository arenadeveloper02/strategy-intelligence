"use client"

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, HeartPulse } from 'lucide-react';
import type {
  ConnectionSettings,
  FinalOutput,
  RunPhase,
  StrategyFormInput,
} from '@/lib/types';
import {
  ApiError,
  MAX_WAIT_MS,
  executeStreamingRun,
  isValidEmail,
  isValidUrl,
} from '@/lib/simApi';
import { logReportRun } from '@/lib/actions';
import StrategyForm from '@/components/StrategyForm';
import ProgressPanel from '@/components/ProgressPanel';
import ReportView from '@/components/ReportView';

const API_BASE_URL =
  'https://agent.thearena.ai/api/workflows/bfb13140-ebef-4be9-a441-1eff11e6d1ea/execute';
const API_KEY = 'sk-sim-Ef4OiRRFe5lN_P1oWWdvCIyrPhPkd7X3';

const CONNECTION: ConnectionSettings = {
  baseUrl: API_BASE_URL,
  apiKey: API_KEY,
  authMode: 'x-api-key',
  headerName: 'X-API-Key',
};

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
  const [form, setForm] = useState<StrategyFormInput>(EMPTY_FORM);
  const [phase, setPhase] = useState<RunPhase>('form');
  const [statusText, setStatusText] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<FinalOutput | null>(null);

  const runTokenRef = useRef(0);
  const startTimeRef = useRef(0);
  const deadlineRef = useRef(0);

  useEffect(() => {
    if (phase !== 'running' && phase !== 'timeout') return;
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
      if (phase === 'running' && Date.now() > deadlineRef.current) {
        setPhase('timeout');
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  const requiredFilled = [
    form.company_name,
    form.website_url,
    form.locations,
    form.vertical,
  ].every((field) => field.trim().length > 0);
  const formValid =
    requiredFilled &&
    isValidUrl(form.website_url.trim()) &&
    (form.recipient_email.trim().length === 0 || isValidEmail(form.recipient_email.trim()));
  const canSubmit = formValid;

  function friendlyError(err: unknown): string {
    console.error('Workflow error', err);
    if (err instanceof ApiError) {
      if (err.status === 401 || err.status === 403) {
        return `The server rejected the credentials (HTTP ${err.status}). Please try again later.`;
      }
      return `The server responded with an error (HTTP ${err.status}). Please try again.`;
    }
    if (err instanceof TypeError) {
      return 'Network error — check your internet connection, then try again.';
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

  async function executeRun(token: number): Promise<void> {
    try {
      const output = await executeStreamingRun(
        CONNECTION,
        {
          company_name: form.company_name.trim(),
          website_url: form.website_url.trim(),
          locations: form.locations.trim(),
          vertical: form.vertical.trim(),
          priority_service_lines: form.priority_service_lines.trim(),
          competitors: form.competitors.trim(),
          budget_tier: form.budget_tier,
          recipient_email: form.recipient_email.trim(),
        },
        {
          isCancelled: () => token !== runTokenRef.current,
          onChunk: (receivedChars) => {
            if (token !== runTokenRef.current) return;
            if (receivedChars > 0) {
              setStatusText(`Streaming report… ${receivedChars.toLocaleString()} characters received`);
            }
          },
        }
      );
      if (token !== runTokenRef.current) return;
      if (output && output.report.trim().length > 0) {
        finishRun(output);
      } else {
        failRun('The run completed, but the report came back empty. Please try again.');
      }
    } catch (err) {
      if (token !== runTokenRef.current) return;
      failRun(friendlyError(err));
    }
  }

  function handleSubmit(): void {
    if (!canSubmit) return;
    const token = runTokenRef.current + 1;
    runTokenRef.current = token;
    startTimeRef.current = Date.now();
    deadlineRef.current = Date.now() + MAX_WAIT_MS;
    setElapsed(0);
    setErrorMessage('');
    setResult(null);
    setStatusText('Starting the workflow stream…');
    setPhase('running');
    void logReportRun(form.company_name.trim(), 'started').catch(() => undefined);
    void executeRun(token);
  }

  function handleCancel(): void {
    runTokenRef.current += 1;
    setStatusText('');
    setPhase('form');
  }

  function handleKeepWaiting(): void {
    deadlineRef.current = Date.now() + MAX_WAIT_MS;
    setStatusText('Resumed — the stream is still open…');
    setPhase('running');
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
          <StrategyForm
            value={form}
            onChange={setForm}
            onSubmit={handleSubmit}
            canSubmit={canSubmit}
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
