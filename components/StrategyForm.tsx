"use client"

import { useState } from 'react';
import { ChevronDown, Sparkles } from 'lucide-react';
import type { StrategyFormInput } from '@/lib/types';
import { isValidEmail, isValidUrl } from '@/lib/simApi';

interface StrategyFormProps {
  value: StrategyFormInput;
  onChange: (value: StrategyFormInput) => void;
  onSubmit: () => void;
  canSubmit: boolean;
}

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100';

export default function StrategyForm({
  value,
  onChange,
  onSubmit,
  canSubmit,
}: StrategyFormProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const set = (field: keyof StrategyFormInput, next: string) => {
    onChange({ ...value, [field]: next });
  };

  const websiteError =
    value.website_url.trim().length > 0 && !isValidUrl(value.website_url.trim())
      ? 'Enter a valid URL (including https://).'
      : '';
  const emailError =
    value.recipient_email.trim().length > 0 && !isValidEmail(value.recipient_email.trim())
      ? 'Enter a valid email address.'
      : '';

  return (
    <section className="card">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-teal-600" />
        <h2 className="text-lg font-semibold text-slate-900">Generate Growth Strategy</h2>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="grid gap-4"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="company-name" className="mb-1 block text-sm font-medium text-slate-700">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              id="company-name"
              type="text"
              value={value.company_name}
              onChange={(e) => set('company_name', e.target.value)}
              placeholder="Lakeside Family Dental"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="website-url" className="mb-1 block text-sm font-medium text-slate-700">
              Website URL <span className="text-red-500">*</span>
            </label>
            <input
              id="website-url"
              type="url"
              value={value.website_url}
              onChange={(e) => set('website_url', e.target.value)}
              placeholder="https://www.example.com"
              className={inputClass}
            />
            {websiteError && <p className="mt-1 text-xs text-red-600">{websiteError}</p>}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="locations" className="mb-1 block text-sm font-medium text-slate-700">
              Location(s) <span className="text-red-500">*</span>
            </label>
            <input
              id="locations"
              type="text"
              value={value.locations}
              onChange={(e) => set('locations', e.target.value)}
              placeholder="Austin, TX metro area"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="vertical" className="mb-1 block text-sm font-medium text-slate-700">
              Healthcare Vertical <span className="text-red-500">*</span>
            </label>
            <input
              id="vertical"
              type="text"
              value={value.vertical}
              onChange={(e) => set('vertical', e.target.value)}
              placeholder="Mental Health, Dental, Med Spa…"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label htmlFor="service-lines" className="mb-1 block text-sm font-medium text-slate-700">
            Priority Service Lines{' '}
            <span className="text-xs font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="service-lines"
            type="text"
            value={value.priority_service_lines}
            onChange={(e) => set('priority_service_lines', e.target.value)}
            placeholder="Invisalign, dental implants, teeth whitening"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-slate-500">
            Comma-separated list of services to prioritize. Leave blank to let the strategist decide.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/60">
          <button
            type="button"
            onClick={() => setAdvancedOpen((v) => !v)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-slate-700"
            aria-expanded={advancedOpen}
          >
            Advanced options
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform ${advancedOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {advancedOpen && (
            <div className="grid gap-4 border-t border-slate-200 px-4 py-4">
              <div>
                <label htmlFor="competitors" className="mb-1 block text-sm font-medium text-slate-700">
                  Competitors
                </label>
                <input
                  id="competitors"
                  type="text"
                  value={value.competitors}
                  onChange={(e) => set('competitors', e.target.value)}
                  placeholder="https://competitor-a.com, https://competitor-b.com"
                  className={inputClass}
                />
                <p className="mt-1 text-xs text-slate-500">Leave blank to auto-discover.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="budget-tier" className="mb-1 block text-sm font-medium text-slate-700">
                    Budget Tier
                  </label>
                  <select
                    id="budget-tier"
                    value={value.budget_tier}
                    onChange={(e) => set('budget_tier', e.target.value)}
                    className={inputClass}
                  >
                    <option value="">All tiers (default)</option>
                    <option value="Low">Low</option>
                    <option value="Mid">Mid</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="recipient-email" className="mb-1 block text-sm font-medium text-slate-700">
                    Recipient Email
                  </label>
                  <input
                    id="recipient-email"
                    type="email"
                    value={value.recipient_email}
                    onChange={(e) => set('recipient_email', e.target.value)}
                    placeholder="analyst@agency.com"
                    className={inputClass}
                  />
                  <p className="mt-1 text-xs text-slate-500">Optional — emails the report when set.</p>
                  {emailError && <p className="mt-1 text-xs text-red-600">{emailError}</p>}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 pt-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            <Sparkles className="h-4 w-4" />
            Generate Growth Strategy
          </button>
        </div>
      </form>
    </section>
  );
}
