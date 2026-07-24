"use client"

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RefreshCw } from 'lucide-react';
import { generateInsights } from '@/lib/actions';
import type { BriefWithInsights } from '@/lib/types';

interface BriefDetailClientProps {
  brief: BriefWithInsights;
}

const categoryStyles: Record<string, string> = {
  Market: 'bg-sky-950 text-sky-300 border-sky-800',
  Growth: 'bg-emerald-950 text-emerald-300 border-emerald-800',
  Risk: 'bg-rose-950 text-rose-300 border-rose-800',
  Operations: 'bg-amber-950 text-amber-300 border-amber-800',
};

function formatDate(value: string): string {
  const d = new Date(value);
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function BriefDetailClient({ brief }: BriefDetailClientProps) {
  const router = useRouter();
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegenerate() {
    setError(null);
    setRegenerating(true);
    const result = await generateInsights(brief.id);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? 'Failed to regenerate insights.');
    }
    setRegenerating(false);
  }

  return (
    <div>
      <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-400 transition hover:text-white">
        <ArrowLeft className="h-4 w-4" /> Back to dashboard
      </Link>

      <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{brief.companyName}</h1>
          <p className="mt-1 text-sm text-slate-400">{brief.industry} · {formatDate(brief.createdAt)}</p>
        </div>
        <button type="button" className="btn-primary" disabled={regenerating} onClick={handleRegenerate}>
          <RefreshCw className={`h-4 w-4 ${regenerating ? 'animate-spin' : ''}`} />
          {regenerating ? 'Regenerating...' : 'Regenerate Insights'}
        </button>
      </div>

      {error && (
        <p className="mt-4 rounded-lg border border-rose-800 bg-rose-950/50 px-4 py-3 text-sm text-rose-300">{error}</p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-slate-500">Primary Objective</p>
          <p className="mt-2 text-sm text-slate-200">{brief.objective}</p>
        </div>
        <div className="card">
          <p className="text-xs uppercase tracking-wide text-slate-500">Market Focus</p>
          <p className="mt-2 text-sm text-slate-200">{brief.marketFocus}</p>
        </div>
        <div className="card sm:col-span-2">
          <p className="text-xs uppercase tracking-wide text-slate-500">Priority Service Lines (optional)</p>
          <p className="mt-2 text-sm text-slate-200">
            {brief.priorityServiceLines ?? 'No priority service lines specified.'}
          </p>
        </div>
      </div>

      <h2 className="mt-10 text-lg font-semibold text-slate-200">Strategic Insights</h2>
      {brief.insights.length === 0 ? (
        <p className="mt-4 text-sm text-slate-400">No insights yet. Use the regenerate button to generate them.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {brief.insights.map((insight) => (
            <div key={insight.id} className="card">
              <span className={`inline-block rounded-full border px-2 py-0.5 text-xs ${categoryStyles[insight.category] ?? 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                {insight.category}
              </span>
              <h3 className="mt-3 font-semibold text-white">{insight.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{insight.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
