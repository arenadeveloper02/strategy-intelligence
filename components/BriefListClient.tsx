"use client"

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, ArrowRight, Lightbulb } from 'lucide-react';
import { deleteBrief } from '@/lib/actions';
import type { BriefData } from '@/lib/types';

interface BriefListClientProps {
  briefs: BriefData[];
}

function formatDate(value: string): string {
  const d = new Date(value);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function BriefListClient({ briefs }: BriefListClientProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeletingId(id);
    const result = await deleteBrief(id);
    if (result.success) {
      router.refresh();
    }
    setDeletingId(null);
  }

  if (briefs.length === 0) {
    return (
      <div className="card text-center">
        <p className="text-sm text-slate-400">No strategy briefs yet.</p>
        <Link href="/new" className="btn-primary mt-4">Create your first brief</Link>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {briefs.map((brief) => (
        <li key={brief.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-white">{brief.companyName}</h3>
              <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-300">{brief.industry}</span>
              {brief.priorityServiceLines ? (
                <span className="rounded-full bg-indigo-950 px-2 py-0.5 text-xs text-indigo-300">Service lines set</span>
              ) : (
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-500">No service lines</span>
              )}
            </div>
            <p className="mt-1 truncate text-sm text-slate-400">{brief.objective}</p>
            <p className="mt-1 flex items-center gap-2 text-xs text-slate-500">
              <Lightbulb className="h-3.5 w-3.5" />
              {brief.insightCount} insight{brief.insightCount === 1 ? '' : 's'} · {formatDate(brief.createdAt)}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Link href={`/briefs/${brief.id}`} className="btn-ghost">
              View <ArrowRight className="h-4 w-4" />
            </Link>
            <button
              type="button"
              className="btn-ghost text-rose-400 hover:border-rose-700 hover:text-rose-300"
              disabled={deletingId === brief.id}
              onClick={() => handleDelete(brief.id)}
              aria-label={`Delete ${brief.companyName} brief`}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
