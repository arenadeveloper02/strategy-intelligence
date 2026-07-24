import { notFound } from 'next/navigation';
import { getBriefById } from '@/lib/actions';
import BriefDetailClient from '@/components/BriefDetailClient';

export const dynamic = 'force-dynamic';

export default async function BriefPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const brief = await getBriefById(id);
  if (!brief) notFound();
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <BriefDetailClient brief={brief} />
    </main>
  );
}
