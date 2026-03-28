import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkPermission } from '@/lib/auth-server';

// GET /api/recouvrement?numFacture=xxx  → liste des montants à recouvrer d'un dossier
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const numFacture = searchParams.get('numFacture')?.trim();

    if (!numFacture) {
        return NextResponse.json({ error: 'numFacture requis' }, { status: 400 });
    }

    try {
        const p = prisma as any;
        if (!p.montant_recouvrer) {
            return NextResponse.json([]); // Table pas encore générée localement
        }
        const rows = await p.montant_recouvrer.findMany({
            where: { num_facture_caution: numFacture },
            orderBy: { id: 'asc' },
        });
        return NextResponse.json(rows);
    } catch (err) {
        console.error('GET Recouvrement Error:', err);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// POST /api/recouvrement  → créer une nouvelle ligne
export async function POST(request: Request) {
    try {
        const userId = request.headers.get('x-user-id') || undefined;
        if (!await checkPermission(userId, 'DOSSIER_WRITE')) {
            return NextResponse.json({ error: 'Permission refusée' }, { status: 403 });
        }
        const body = await request.json();
        const { num_facture_caution, libelle, montant } = body;

        if (!num_facture_caution) {
            return NextResponse.json({ error: 'num_facture_caution requis' }, { status: 400 });
        }

        const p = prisma as any;
        if (!p.montant_recouvrer) throw new Error('Table non générée');

        const row = await p.montant_recouvrer.create({
            data: {
                num_facture_caution,
                libelle: libelle || null,
                montant: montant !== null && montant !== undefined && montant !== "" ? parseFloat(montant) : null,
            }
        });
        return NextResponse.json(row, { status: 201 });
    } catch (err) {
        console.error('POST Recouvrement Error:', err);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// PUT /api/recouvrement  → mettre à jour une ligne existante
export async function PUT(request: Request) {
    try {
        const userId = request.headers.get('x-user-id') || undefined;
        if (!await checkPermission(userId, 'DOSSIER_WRITE')) {
            return NextResponse.json({ error: 'Permission refusée' }, { status: 403 });
        }
        const body = await request.json();
        const { id, libelle, montant } = body;

        if (!id) {
            return NextResponse.json({ error: 'id requis' }, { status: 400 });
        }

        const p = prisma as any;
        const row = await p.montant_recouvrer.update({
            where: { id: Number(id) },
            data: {
                libelle: libelle || null,
                montant: montant !== null && montant !== undefined && montant !== "" ? parseFloat(montant) : null,
            }
        });
        return NextResponse.json(row);
    } catch (err) {
        console.error('PUT Recouvrement Error:', err);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// DELETE /api/recouvrement?id=xxx
export async function DELETE(request: Request) {
    try {
        const userId = request.headers.get('x-user-id') || undefined;
        if (!await checkPermission(userId, 'DOSSIER_WRITE')) {
            return NextResponse.json({ error: 'Permission refusée' }, { status: 403 });
        }
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'id requis' }, { status: 400 });
        }

        const p = prisma as any;
        await p.montant_recouvrer.delete({ where: { id: Number(id) } });
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('DELETE Recouvrement Error:', err);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
