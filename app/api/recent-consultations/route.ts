import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const allConsultations = await prisma.recent_consultations.findMany({
      orderBy: { consulted_at: 'desc' },
      select: {
        num_facture_caution: true,
        consulted_at: true
      }
    });

    return NextResponse.json(allConsultations);
  } catch (error) {
    console.error('Erreur recent consultations:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
