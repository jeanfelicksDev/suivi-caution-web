import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const type = searchParams.get('type') || 'reception'; // reception, sig1, sig2

    if (!from || !to) {
        return NextResponse.json({ error: 'Dates manquantes' }, { status: 400 });
    }

    // Déterminer le champ de filtrage
    let filterField = 'date_reception';
    if (type === 'sig1') filterField = 'date_1er_signature';
    if (type === 'sig2') filterField = 'date_2e_signature';

    try {
        const dossiers = await prisma.dossiers_caution.findMany({
            where: {
                [filterField]: {
                    gte: from,
                    lte: to
                }
            },
            select: {
                armateur: true,
                num_bl: true,
                date_reception: true,
                date_1er_signature: true,
                date_2e_signature: true
            },
            orderBy: [
                { armateur: 'asc' },
                { num_bl: 'asc' }
            ]
        });

        // Effectuer le groupement par armateur manuellement
        const groupedMap = new Map<string, string[]>();
        dossiers.forEach(d => {
            const arm = d.armateur || 'SANS ARMATEUR';
            if (!groupedMap.has(arm)) {
                groupedMap.set(arm, []);
            }
            if (d.num_bl) {
                groupedMap.get(arm)?.push(d.num_bl);
            }
        });

        const grouped = Array.from(groupedMap.entries()).map(([name, bls]) => ({
            name,
            bls
        }));

        return NextResponse.json({ 
            from, 
            to, 
            grouped 
        });
    } catch (error: any) {
        console.error('Error generating report data:', error);
        return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
    }
}
