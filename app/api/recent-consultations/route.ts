import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // 1. Fetch all consultations ordered by most recent
    const allConsultations = await prisma.recent_consultations.findMany({
      orderBy: { consulted_at: 'desc' },
      select: {
        num_facture_caution: true,
        consulted_at: true
      }
    });

    if (allConsultations.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Get unique invoice numbers to query dossiers in one shot
    const uniqueNums = [...new Set(allConsultations.map(c => c.num_facture_caution))];

    // 3. Fetch dossier details for those invoices
    const dossiers = await prisma.dossiers_caution.findMany({
      where: { num_facture_caution: { in: uniqueNums } },
      select: {
        num_facture_caution: true,
        transitaire_nom: true,
        client_nom: true,
      }
    });

    // 4. Build a lookup map
    const dossierMap = new Map<string, { transitaire_nom: string | null; client_nom: string | null }>();
    for (const d of dossiers) {
      if (d.num_facture_caution) {
        dossierMap.set(d.num_facture_caution, {
          transitaire_nom: d.transitaire_nom,
          client_nom: d.client_nom,
        });
      }
    }

    // 5. Merge consultations with dossier info
    const results = allConsultations.map(c => {
      const dossier = dossierMap.get(c.num_facture_caution);
      return {
        num_facture_caution: c.num_facture_caution,
        consulted_at: c.consulted_at,
        nom: dossier?.transitaire_nom || dossier?.client_nom || '—',
      };
    });

    return NextResponse.json(results);
  } catch (error) {
    console.error('Erreur recent consultations:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
