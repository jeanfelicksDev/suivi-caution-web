import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const armateur = searchParams.get('armateur') || '';
        const startDate = searchParams.get('startDate') || '';
        const endDate = searchParams.get('endDate') || '';

        let rangeStart: Date;
        let rangeEnd: Date;

        if (startDate && endDate) {
            rangeStart = new Date(startDate);
            rangeEnd = new Date(endDate);
            rangeEnd.setDate(rangeEnd.getDate() + 1);
        } else if (startDate) {
            rangeStart = new Date(startDate);
            rangeEnd = new Date();
            rangeEnd.setDate(rangeEnd.getDate() + 1);
        } else if (endDate) {
            rangeEnd = new Date(endDate);
            rangeEnd.setDate(rangeEnd.getDate() + 1);
            rangeStart = new Date(rangeEnd.getFullYear() - 1, rangeEnd.getMonth(), 1);
        } else {
            const now = new Date();
            rangeEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            rangeStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        }

        const months: { label: string; year: number; month: number }[] = [];
        const cursor = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
        while (cursor < rangeEnd) {
            months.push({
                label: cursor.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }),
                year: cursor.getFullYear(),
                month: cursor.getMonth() + 1,
            });
            cursor.setMonth(cursor.getMonth() + 1);
        }

        const armateurFilter = armateur ? { armateur } : {};

        const reçus: number[] = [];
        const chèques: number[] = [];

        for (const m of months) {
            const start = new Date(m.year, m.month - 1, 1);
            const end = new Date(m.year, m.month, 1);

            const totalRecu = await prisma.dossiers_caution.count({
                where: {
                    ...armateurFilter,
                    date_reception: { gte: start, lt: end }
                }
            });

            const totalCheque = await prisma.dossiers_caution.count({
                where: {
                    ...armateurFilter,
                    date_cheque: { gte: start, lt: end }
                }
            });

            reçus.push(totalRecu);
            chèques.push(totalCheque);
        }

        return NextResponse.json({
            labels: months.map(m => m.label),
            reçus,
            chèques,
        });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
