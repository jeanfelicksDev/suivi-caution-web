import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get the 10 most recent unique consultations
    // Prisma doesn't have a direct "distinct limit" with order by date easily without complex aggregations
    // So we fetch the latest 50, and filter down to 10 unique invoices in memory.
    const recentLogs = await prisma.recent_consultations.findMany({
      orderBy: { consulted_at: 'desc' },
      take: 50,
      select: {
        num_facture_caution: true,
        consulted_at: true
      }
    });

    const uniqueInvoices: string[] = [];
    const results = [];

    for (const log of recentLogs) {
      if (!uniqueInvoices.includes(log.num_facture_caution)) {
        uniqueInvoices.push(log.num_facture_caution);
        results.push(log);
        if (uniqueInvoices.length === 10) break;
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Erreur recent consultations:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
