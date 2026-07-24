"use client"

import { useState } from 'react';
import { Eye, EyeOff, KeyRound, Link2 } from 'lucide-react';
import type { AuthMode } from '@/lib/types';

interface ConnectionCardProps {
  baseUrl: string;
  apiKey: string;
  authMode: AuthMode;
  headerName: string;
  onBaseUrlChange: (value: string) => void;
  onApiKeyChange: (value: string) => void;
  onAuthModeChange: (value: AuthMode) => void;
  onHeaderNameChange: (value: string) => void;
}

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100';

export default function ConnectionCard({
  baseUrl,
  apiKey,
  authMode,
  headerName,
  onBaseUrlChange,
  onApiKeyChange,
  onAuthModeChange,
  onHeaderNameChange,
}: ConnectionCardProps) {
  const [showKey, setShowKey] = useState(false);

  return (
    <section className="card">
      <div className="mb-4 flex items-center gap-2">
        <KeyRound className="h-5 w-5 text-teal-600" />
        <h2 className="text-lg font-semibold text-slate-900">Connection</h2>
      </div>
      <div className="grid gap-4">
        <div>
          <label htmlFor="base-url" className="mb-1 block text-sm font-medium text-slate-700">
            API Base URL <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="base-url"
              type="url"
              value={baseUrl}
              onChange={(e) => onBaseUrlChange(e.target.value)}
              placeholder="https://agent.thearena.ai/api/workflows/…/execute"
              className={`${inputClass} pl-9`}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">
            The deployed workflow execute endpoint. Editable if your deployment differs.
          </p>
        </div>

        <div>
          <label htmlFor="api-key" className="mb-1 block text-sm font-medium text-slate-700">
            API Key <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="api-key"
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => onApiKeyChange(e.target.value)}
              placeholder="Paste your Sim API key"
              autoComplete="off"
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              aria-label={showKey ? 'Hide API key' : 'Show API key'}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Kept in memory only — never stored, sent anywhere except the API, or logged.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="mb-1 block text-sm font-medium text-slate-700">Auth header style</span>
            <div className="flex rounded-lg border border-slate-300 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => onAuthModeChange('x-api-key')}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  authMode === 'x-api-key'
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Custom header
              </button>
              <button
                type="button"
                onClick={() => onAuthModeChange('bearer')}
                className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition ${
                  authMode === 'bearer'
                    ? 'bg-white text-teal-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Bearer token
              </button>
            </div>
          </div>
          {authMode === 'x-api-key' ? (
            <div>
              <label htmlFor="header-name" className="mb-1 block text-sm font-medium text-slate-700">
                Header name
              </label>
              <input
                id="header-name"
                type="text"
                value={headerName}
                onChange={(e) => onHeaderNameChange(e.target.value)}
                placeholder="X-API-Key"
                className={inputClass}
              />
            </div>
          ) : (
            <div className="flex items-end">
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                Requests will send <code className="font-mono">Authorization: Bearer &lt;key&gt;</code>
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
