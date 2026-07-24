'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { SIM_API_KEY, SIM_API_URL } from '@/lib/config';
import type { ActionResult, BriefData, BriefInput, BriefWithInsights } from '@/lib/types';

export async function logReportRun(
  companyName: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await prisma.reportRun.create({
      data: {
        companyName: companyName || 'Unknown company',
        status,
      },
    });
    return { success: true };
  } catch (err) {
    console.error('Failed to log report run', err);
    return { success: false, error: 'Failed to log run' };
  }
}

interface InsightSeed {
  title: string;
  content: string;
  category: string;
}

interface BriefRecord {
  companyName: string;
  industry: string;
  objective: string;
  marketFocus: string;
  priorityServiceLines: string | null;
}

function isInsightSeed(value: unknown): value is InsightSeed {
  if (typeof value !== 'object' || value === null) return false;
  const o = value as Record<string, unknown>;
  return (
    typeof o.title === 'string' &&
    typeof o.content === 'string' &&
    typeof o.category === 'string'
  );
}

async function fetchAiInsights(brief: BriefRecord): Promise<InsightSeed[] | null> {
  try {
    const serviceLinesNote = brief.priorityServiceLines
      ? `Priority service lines: ${brief.priorityServiceLines}.`
      : 'No priority service lines were specified.';
    const res = await fetch(SIM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${SIM_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'sim-strategy-1',
        messages: [
          {
            role: 'user',
            content: `Generate a JSON object with an "insights" array of 4 items, each with title, content, and category (Market, Growth, Risk, or Operations) for this strategy brief. Company: ${brief.companyName}. Industry: ${brief.industry}. Objective: ${brief.objective}. Market focus: ${brief.marketFocus}. ${serviceLinesNote}`,
          },
        ],
      }),
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data: unknown = await res.json();
    if (typeof data !== 'object' || data === null) return null;
    const container = data as Record<string, unknown>;
    const raw = container.insights;
    if (!Array.isArray(raw)) return null;
    const seeds = raw.filter(isInsightSeed);
    return seeds.length > 0 ? seeds : null;
  } catch {
    return null;
  }
}

function buildLocalInsights(brief: BriefRecord): InsightSeed[] {
  const seeds: InsightSeed[] = [
    {
      title: `Market positioning for ${brief.companyName}`,
      content: `Within the ${brief.industry} industry, ${brief.companyName} should sharpen differentiation around its stated market focus (${brief.marketFocus}). Benchmark the top three competitors on pricing, delivery speed, and customer experience, then anchor messaging on the widest capability gap.`,
      category: 'Market',
    },
    {
      title: 'Growth pathway aligned to the core objective',
      content: `The objective — "${brief.objective}" — is best served by a two-horizon plan: consolidate existing revenue streams in the next two quarters while piloting one adjacent offering in ${brief.marketFocus}. Set a quarterly review gate with explicit go/no-go metrics.`,
      category: 'Growth',
    },
    {
      title: 'Risk exposure and mitigation',
      content: `Key risks for ${brief.companyName} include demand concentration in ${brief.marketFocus} and execution bandwidth in ${brief.industry}. Mitigate by diversifying the top-customer mix below 40% of revenue and by pre-committing capacity for the strategic objective before launching new initiatives.`,
      category: 'Risk',
    },
  ];
  if (brief.priorityServiceLines && brief.priorityServiceLines.trim().length > 0) {
    seeds.push({
      title: 'Priority service line focus',
      content: `Concentrate operational investment on the declared priority service lines (${brief.priorityServiceLines}). Assign a single accountable owner per line, define a 90-day utilization target, and sunset any line that falls below 60% of target for two consecutive months.`,
      category: 'Operations',
    });
  } else {
    seeds.push({
      title: 'Operational readiness baseline',
      content: `No priority service lines were specified, so establish an operational baseline first: map current capacity across all offerings in ${brief.industry}, identify the two highest-margin lines, and nominate them as candidates for prioritization in the next planning cycle.`,
      category: 'Operations',
    });
  }
  return seeds;
}

async function createInsightsForBrief(briefId: string, brief: BriefRecord): Promise<void> {
  const aiSeeds = await fetchAiInsights(brief);
  const seeds = aiSeeds ?? buildLocalInsights(brief);
  await prisma.insight.createMany({
    data: seeds.map((s) => ({
      title: s.title,
      content: s.content,
      category: s.category,
      briefId,
    })),
  });
}

export async function getBriefs(): Promise<BriefData[]> {
  const briefs = await prisma.strategyBrief.findMany({
    orderBy: { createdAt: 'desc' },
    include: { _count: { select: { insights: true } } },
  });
  return briefs.map((b) => ({
    id: b.id,
    companyName: b.companyName,
    industry: b.industry,
    objective: b.objective,
    marketFocus: b.marketFocus,
    priorityServiceLines: b.priorityServiceLines,
    createdAt: b.createdAt.toISOString(),
    insightCount: b._count.insights,
  }));
}

export async function getBriefById(id: string): Promise<BriefWithInsights | null> {
  const brief = await prisma.strategyBrief.findUnique({
    where: { id },
    include: { insights: { orderBy: { createdAt: 'asc' } } },
  });
  if (!brief) return null;
  return {
    id: brief.id,
    companyName: brief.companyName,
    industry: brief.industry,
    objective: brief.objective,
    marketFocus: brief.marketFocus,
    priorityServiceLines: brief.priorityServiceLines,
    createdAt: brief.createdAt.toISOString(),
    insights: brief.insights.map((i) => ({
      id: i.id,
      title: i.title,
      content: i.content,
      category: i.category,
    })),
  };
}

export async function createBrief(input: BriefInput): Promise<ActionResult> {
  const companyName = input.companyName.trim();
  const industry = input.industry.trim();
  const objective = input.objective.trim();
  const marketFocus = input.marketFocus.trim();
  const priorityServiceLines = input.priorityServiceLines?.trim() ?? '';

  if (!companyName || !industry || !objective || !marketFocus) {
    return { success: false, error: 'Company name, industry, objective, and market focus are required.' };
  }

  try {
    const brief = await prisma.strategyBrief.create({
      data: {
        companyName,
        industry,
        objective,
        marketFocus,
        priorityServiceLines: priorityServiceLines.length > 0 ? priorityServiceLines : null,
      },
    });
    await createInsightsForBrief(brief.id, {
      companyName: brief.companyName,
      industry: brief.industry,
      objective: brief.objective,
      marketFocus: brief.marketFocus,
      priorityServiceLines: brief.priorityServiceLines,
    });
    revalidatePath('/');
    return { success: true, id: brief.id };
  } catch {
    return { success: false, error: 'Failed to create the strategy brief. Please try again.' };
  }
}

export async function generateInsights(briefId: string): Promise<ActionResult> {
  try {
    const brief = await prisma.strategyBrief.findUnique({ where: { id: briefId } });
    if (!brief) {
      return { success: false, error: 'Brief not found.' };
    }
    await prisma.insight.deleteMany({ where: { briefId } });
    await createInsightsForBrief(briefId, {
      companyName: brief.companyName,
      industry: brief.industry,
      objective: brief.objective,
      marketFocus: brief.marketFocus,
      priorityServiceLines: brief.priorityServiceLines,
    });
    revalidatePath(`/briefs/${briefId}`);
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to regenerate insights.' };
  }
}

export async function deleteBrief(id: string): Promise<ActionResult> {
  try {
    await prisma.strategyBrief.delete({ where: { id } });
    revalidatePath('/');
    return { success: true };
  } catch {
    return { success: false, error: 'Failed to delete the brief.' };
  }
}
