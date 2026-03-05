import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Récupérer tous les armateurs
export async function GET() {
    try {
        const armateurs = await prisma.armateurs.findMany({
            orderBy: { nom: 'asc' },
        });
        return NextResponse.json(armateurs);
    } catch (error) {
        console.error('Error fetching armateurs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// POST: Ajouter un nouvel armateur
export async function POST(request: Request) {
    try {
        const { nom } = await request.json();
        if (!nom || !nom.trim()) {
            return NextResponse.json({ error: 'Nom requis' }, { status: 400 });
        }
        const armateur = await prisma.armateurs.create({
            data: { nom: nom.trim().toUpperCase() },
        });
        return NextResponse.json(armateur);
    } catch (error: any) {
        if (error?.code === 'P2002') {
            return NextResponse.json({ error: 'Cet armateur existe déjà' }, { status: 409 });
        }
        console.error('Error creating armateur:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
