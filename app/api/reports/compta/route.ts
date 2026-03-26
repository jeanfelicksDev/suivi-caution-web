import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    if (!from || !to) {
        return NextResponse.json({ error: 'Dates manquantes' }, { status: 400 });
    }

    try {
        const dossiers = await prisma.dossiers_caution.findMany({
            where: {
                date_transmission_compta: {
                    gte: from,
                    lte: to
                }
            },
            select: {
                date_transmission_compta: true,
                num_facture_caution: true,
                montant_final: true,
                transitaire_nom: true,
                mandataire_nom: true,
            },
            orderBy: {
                date_transmission_compta: 'asc'
            }
        });

        return NextResponse.json({ 
            from, 
            to, 
            dossiers 
        });
    } catch (error: any) {
        console.error('Error generating compta report data:', error);
        return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
    }
}
