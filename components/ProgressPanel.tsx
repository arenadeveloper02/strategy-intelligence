"use client"

import { AlertTriangle, Check, Clock, Loader2 } from 'lucide-react';

interface ProgressPanelProps {
  elapsedSeconds: number;
  statusText: string;
  timedOut: boolean;
  onCancel: () => void;
  onKeepWaiting: () => void;
  onRetry: () => void;
}

const STAGES: { label: string; at: number }[] = [
  { label: 'Site Discovery', at: 0 },
  { label: 'Competitor Benchmark', at: 120 },
  { label: 'Idea Engine', at: 270 },
  { label: 'Synthesis & Report', at: 420 },
];

function formatElapsed(total: number): string {
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function ProgressPanel({
  elapsedSeconds,
  statusText,
  timedOut,
  onCancel,
  onKeepWaiting,
  onRetry,
}: ProgressPanelProps) {
  const activeIndex = STAGES.reduce(
    (acc, stage, index) => (elapsedSeconds >= stage.at ? index : acc),
    0
  );

  return (
    <section className="card">
      <div className="flex flex-col items-center gap-6 py-4 text-center">
        {timedOut ? (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-7 w-7 text-amber-600" />
          </div>
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-teal-100">
            <Loader2 className="h-7 w-7 animate-spin text-teal-600" />
          </div>
        )}

        <div>
          <h2 className="text-xl font-semibold text-slate-900">
            {timedOut ? 'This is taking longer than expected' : 'Generating your growth strategy'}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            This typically takes 6–9 minutes — you can keep this tab open.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-sm font-medium text-slate-700">
          <Clock className="h-4 w-4 text-slate-400" />
          Elapsed: {formatElapsed(elapsedSeconds)}
        </div>

        <ol className="flex w-full max-w-2xl flex-col gap-4 sm:flex-row sm:items-start sm:gap-0">
          {STAGES.map((stage, index) => {
            const isDone = index < activeIndex;
            const isActive = index === activeIndex && !timedOut;
            return (
              <li key={stage.label} className="flex flex-1 items-center gap-3 sm:flex-col sm:gap-2">
                <div className="flex items-center sm:w-full">
                  <div className="hidden flex-1 sm:block">
                    {index > 0 && (
                      <div
                        className={`h-0.5 w-full ${index <= activeIndex ? 'bg-teal-400' : 'bg-slate-200'}`}
                      />
                    )}
                  </div>
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 ${
                      isDone
                        ? 'border-teal-500 bg-teal-500 text-white'
                        : isActive
                          ? 'border-teal-500 bg-white text-teal-600'
                          : 'border-slate-300 bg-white text-slate-400'
                    }`}
                  >
                    {isDone ? (
                      <Check className="h-4 w-4" />
                    ) : isActive ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <span className="text-xs font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <div className="hidden flex-1 sm:block">
                    {index < STAGES.length - 1 && (
                      <div
                        className={`h-0.5 w-full ${index < activeIndex ? 'bg-teal-400' : 'bg-slate-200'}`}
                      />
                    )}
                  </div>
                </div>
                <span
                  className={`text-left text-xs font-medium sm:text-center ${
                    isDone || isActive ? 'text-teal-700' : 'text-slate-400'
                  }`}
                >
                  {stage.label}
                </span>
              </li>
            );
          })}
        </ol>

        {statusText && <p className="text-xs text-slate-500">{statusText}</p>}

        {timedOut ? (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={onKeepWaiting}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
            >
              Keep waiting
            </button>
            <button
              type="button"
              onClick={onRetry}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Retry from start
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 hover:text-slate-700"
            >
              Back to form
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        )}
      </div>
    </section>
  );
}
