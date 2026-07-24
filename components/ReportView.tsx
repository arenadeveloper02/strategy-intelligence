"use client"

import { useState } from 'react';
import { Building2, Check, Copy, Download, FileText, Printer, RotateCcw } from 'lucide-react';
import type { FinalOutput } from '@/lib/types';
import MarkdownReport from '@/components/MarkdownReport';

interface ReportViewProps {
  result: FinalOutput;
  onNewReport: () => void;
}

export default function ReportView({ result, onNewReport }: ReportViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(result.report)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch((err) => console.error('Copy failed', err));
  };

  const handleDownload = () => {
    const blob = new Blob([result.report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = result.file_saved || 'growth-strategy.md';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const buttonClass =
    'inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50';

  return (
    <div className="space-y-4">
      <div className="no-print card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100">
            <Building2 className="h-5 w-5 text-teal-700" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {result.company || 'Growth Strategy Report'}
            </h2>
            {result.file_saved && (
              <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                <FileText className="h-3 w-3" />
                {result.file_saved}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={handleCopy} className={buttonClass}>
            {copied ? <Check className="h-4 w-4 text-teal-600" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy Markdown'}
          </button>
          <button type="button" onClick={handleDownload} className={buttonClass}>
            <Download className="h-4 w-4" />
            Download .md
          </button>
          <button type="button" onClick={handlePrint} className={buttonClass}>
            <Printer className="h-4 w-4" />
            Print / Save as PDF
          </button>
          <button
            type="button"
            onClick={onNewReport}
            className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            <RotateCcw className="h-4 w-4" />
            New Report
          </button>
        </div>
      </div>

      <div className="print-area card">
        <MarkdownReport markdown={result.report} />
      </div>
    </div>
  );
}
