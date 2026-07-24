"use client"

import type { ReactNode } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';

interface MarkdownReportProps {
  markdown: string;
}

function transform(node: ReactNode, keyPrefix: string): ReactNode {
  if (typeof node === 'string') {
    const parts = node.split(/(\[Strategic\]|\[Tactical\])/g);
    if (parts.length === 1) return node;
    return parts.map((part, index) => {
      if (part === '[Strategic]') {
        return (
          <span key={`${keyPrefix}-${index}`} className="tag-badge tag-strategic">
            Strategic
          </span>
        );
      }
      if (part === '[Tactical]') {
        return (
          <span key={`${keyPrefix}-${index}`} className="tag-badge tag-tactical">
            Tactical
          </span>
        );
      }
      return <span key={`${keyPrefix}-${index}`}>{part}</span>;
    });
  }
  if (Array.isArray(node)) {
    return node.map((child, index) => transform(child, `${keyPrefix}-${index}`));
  }
  return node;
}

const components: Components = {
  table: ({ children }) => (
    <div className="table-scroll">
      <table>{children}</table>
    </div>
  ),
  h1: ({ children }) => <h1>{transform(children, 'h1')}</h1>,
  h2: ({ children }) => <h2>{transform(children, 'h2')}</h2>,
  h3: ({ children }) => <h3>{transform(children, 'h3')}</h3>,
  p: ({ children }) => <p>{transform(children, 'p')}</p>,
  li: ({ children }) => <li>{transform(children, 'li')}</li>,
  td: ({ children }) => <td>{transform(children, 'td')}</td>,
  strong: ({ children }) => <strong>{transform(children, 'strong')}</strong>,
};

export default function MarkdownReport({ markdown }: MarkdownReportProps) {
  return (
    <div className="report-body">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
