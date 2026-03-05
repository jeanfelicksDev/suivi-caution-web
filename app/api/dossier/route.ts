import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Basic validation
        if (!body.num_facture_caution) {
            return NextResponse.json({ error: 'Numéro de facture requis' }, { status: 400 });
        }

        const newDossier = await prisma.dossiers_caution.create({
            data: {
                ...body,
                created_at: new Date(),
                updated_at: new Date(),
            }
        });

        return NextResponse.json(newDossier);
    } catch (error) {
        console.error('Error creating dossier:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
