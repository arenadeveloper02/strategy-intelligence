'use server';

import { prisma } from '@/lib/prisma';

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
