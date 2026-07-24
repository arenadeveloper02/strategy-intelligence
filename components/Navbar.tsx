import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold">SI</span>
          Strategy Intelligence
        </Link>
        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="text-slate-300 transition hover:text-white">Dashboard</Link>
          <Link href="/new" className="btn-primary">New Brief</Link>
        </div>
      </nav>
    </header>
  );
}
