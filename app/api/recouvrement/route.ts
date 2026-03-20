import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/recouvrement?numFacture=xxx  → liste des montants à recouvrer d'un dossier
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const numFacture = searchParams.get('numFacture')?.trim();

    if (!numFacture) {
        return NextResponse.json({ error: 'numFacture requis' }, { status: 400 });
    }

    const rows = await prisma.montant_recouvrer.findMany({
        where: { num_facture_caution: numFacture },
        orderBy: { id: 'asc' },
    });

    return NextResponse.json(rows);
}

// POST /api/recouvrement  → créer une nouvelle ligne
export async function POST(request: Request) {
    const body = await request.json();
    const { num_facture_caution, libelle, montant } = body;

    if (!num_facture_caution) {
        return NextResponse.json({ error: 'num_facture_caution requis' }, { status: 400 });
    }

    const row = await prisma.montant_recouvrer.create({
        data: {
            num_facture_caution,
            libelle: libelle || null,
            montant: montant !== null && montant !== undefined && montant !== "" ? parseFloat(montant) : null,
        }
    });

    return NextResponse.json(row, { status: 201 });
}

// PUT /api/recouvrement  → mettre à jour une ligne existante
export async function PUT(request: Request) {
    const body = await request.json();
    const { id, libelle, montant } = body;

    if (!id) {
        return NextResponse.json({ error: 'id requis' }, { status: 400 });
    }

    const row = await prisma.montant_recouvrer.update({
        where: { id: Number(id) },
        data: {
            libelle: libelle || null,
            montant: montant !== null && montant !== undefined && montant !== "" ? parseFloat(montant) : null,
        }
    });

    return NextResponse.json(row);
}

// DELETE /api/recouvrement?id=xxx
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'id requis' }, { status: 400 });
    }

    await prisma.montant_recouvrer.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
}
