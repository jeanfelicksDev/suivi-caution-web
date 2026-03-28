import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkPermission } from '@/lib/auth-server';

// GET /api/detention?numFacture=xxx  → liste des détentions d'un dossier
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const numFacture = searchParams.get('numFacture')?.trim();

    if (!numFacture) {
        return NextResponse.json({ error: 'numFacture requis' }, { status: 400 });
    }

    const rows = await prisma.facture_dmdt.findMany({
        where: { num_facture_caution: numFacture },
        orderBy: { date_dmdt: 'asc' },
    });

    return NextResponse.json(rows);
}

// POST /api/detention  → créer une nouvelle ligne
export async function POST(request: Request) {
    const userId = request.headers.get('x-user-id') || undefined;
    if (!await checkPermission(userId, 'DOSSIER_WRITE')) {
        return NextResponse.json({ error: 'Permission refusée' }, { status: 403 });
    }
    const body = await request.json();
    const { num_facture_caution, num_facture_dmdt, montant_facture, commentaire, date_dmdt } = body;

    if (!num_facture_caution) {
        return NextResponse.json({ error: 'num_facture_caution requis' }, { status: 400 });
    }

    const row = await prisma.facture_dmdt.create({
        data: {
            num_facture_caution,
            num_facture_dmdt: num_facture_dmdt || null,
            montant_facture: montant_facture ? parseFloat(montant_facture) : null,
            commentaire: commentaire || null,
            date_dmdt: date_dmdt || null,
        }
    });

    return NextResponse.json(row, { status: 201 });
}

// PUT /api/detention  → mettre à jour une ligne existante
export async function PUT(request: Request) {
    const userId = request.headers.get('x-user-id') || undefined;
    if (!await checkPermission(userId, 'DOSSIER_WRITE')) {
        return NextResponse.json({ error: 'Permission refusée' }, { status: 403 });
    }
    const body = await request.json();
    const { id, num_facture_dmdt, montant_facture, commentaire, date_dmdt } = body;

    if (!id) {
        return NextResponse.json({ error: 'id requis' }, { status: 400 });
    }

    const row = await prisma.facture_dmdt.update({
        where: { id: Number(id) },
        data: {
            num_facture_dmdt: num_facture_dmdt || null,
            montant_facture: montant_facture ? parseFloat(montant_facture) : null,
            commentaire: commentaire || null,
            date_dmdt: date_dmdt || null,
        }
    });

    return NextResponse.json(row);
}

// DELETE /api/detention?id=xxx
export async function DELETE(request: Request) {
    const userId = request.headers.get('x-user-id') || undefined;
    if (!await checkPermission(userId, 'DOSSIER_WRITE')) {
        return NextResponse.json({ error: 'Permission refusée' }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ error: 'id requis' }, { status: 400 });
    }

    await prisma.facture_dmdt.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
}
