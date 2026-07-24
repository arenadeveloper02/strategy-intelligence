import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Healthcare Growth Strategist',
  description:
    'Generate a prioritized organic-growth strategy for healthcare brands: site audit, competitor benchmark, and a ranked roadmap report.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-gradient-to-b from-teal-50 via-slate-50 to-white text-slate-900 antialiased`}>
        {children}
      </body>
    </html>
  );
}
