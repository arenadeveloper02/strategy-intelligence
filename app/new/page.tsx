import BriefFormClient from '@/components/BriefFormClient';

export const metadata = {
  title: 'New Strategy Brief | Strategy Intelligence',
};

export default function NewBriefPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">New Strategy Brief</h1>
      <p className="mt-1 text-sm text-slate-400">
        Complete the company profile and strategic objectives. Priority service lines are optional.
      </p>
      <div className="mt-8">
        <BriefFormClient />
      </div>
    </main>
  );
}
