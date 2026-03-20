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
                date_reception: {
                    gte: from,
                    lte: to
                }
            },
            select: {
                armateur: true,
                num_bl: true,
                date_reception: true
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
    } catch (error) {
        console.error('Error generating report data:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
