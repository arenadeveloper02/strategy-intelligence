"use client"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrief } from '@/lib/actions';

export default function BriefFormClient() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [objective, setObjective] = useState('');
  const [marketFocus, setMarketFocus] = useState('');
  const [priorityServiceLines, setPriorityServiceLines] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (!companyName.trim() || !industry.trim() || !objective.trim() || !marketFocus.trim()) {
      setError('Please fill in all required fields. Priority service lines are optional.');
      return;
    }
    setSubmitting(true);
    const result = await createBrief({
      companyName,
      industry,
      objective,
      marketFocus,
      priorityServiceLines: priorityServiceLines.trim() || undefined,
    });
    if (result.success && result.id) {
      router.push(`/briefs/${result.id}`);
    } else {
      setError(result.error ?? 'Something went wrong.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="card">
        <h2 className="text-base font-semibold text-slate-200">Company Profile</h2>
        <p className="mt-1 text-xs text-slate-500">Tell us who this brief is for.</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="companyName" className="field-label">Company name <span className="text-rose-400">*</span></label>
            <input
              id="companyName"
              type="text"
              className="field-input"
              placeholder="Acme Corp"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="industry" className="field-label">Industry <span className="text-rose-400">*</span></label>
            <input
              id="industry"
              type="text"
              className="field-input"
              placeholder="Healthcare, SaaS, Logistics..."
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="card">
        <h2 className="text-base font-semibold text-slate-200">Strategic Objectives</h2>
        <p className="mt-1 text-xs text-slate-500">Define the primary objective and market focus.</p>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="objective" className="field-label">Primary objective <span className="text-rose-400">*</span></label>
            <textarea
              id="objective"
              rows={3}
              className="field-input"
              placeholder="e.g. Expand into the mid-market segment within 12 months"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="marketFocus" className="field-label">Market focus <span className="text-rose-400">*</span></label>
            <input
              id="marketFocus"
              type="text"
              className="field-input"
              placeholder="e.g. North America mid-market"
              value={marketFocus}
              onChange={(e) => setMarketFocus(e.target.value)}
            />
          </div>
        </div>
      </section>

      <section className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-200">Priority Service Lines</h2>
          <span className="rounded-full border border-slate-700 px-2 py-0.5 text-xs text-slate-400">Optional</span>
        </div>
        <p className="mt-1 text-xs text-slate-500">Leave blank if you have no specific service lines to prioritize.</p>
        <div className="mt-4">
          <label htmlFor="priorityServiceLines" className="field-label">Service lines</label>
          <textarea
            id="priorityServiceLines"
            rows={2}
            className="field-input"
            placeholder="e.g. Managed services, Advisory, Implementation (optional)"
            value={priorityServiceLines}
            onChange={(e) => setPriorityServiceLines(e.target.value)}
          />
        </div>
      </section>

      {error && (
        <p className="rounded-lg border border-rose-800 bg-rose-950/50 px-4 py-3 text-sm text-rose-300">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? 'Generating insights...' : 'Create Brief & Generate Insights'}
        </button>
        <button type="button" className="btn-ghost" disabled={submitting} onClick={() => router.push('/')}>
          Cancel
        </button>
      </div>
    </form>
  );
}
