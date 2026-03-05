import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ numFacture: string }> }
) {
    const { numFacture } = await params;

    try {
        const dossier = await prisma.dossiers_caution.findFirst({
            where: {
                num_facture_caution: numFacture
            }
        });

        if (!dossier) {
            return NextResponse.json({ found: false });
        }

        // Vérifier si le chèque est dans la table Excel ou Access
        // On effectue la recherche sur le numéro de facture OU le numéro d'Avoir (si défini)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = prisma as any;
        const numAvoir = dossier.num_avoir || '';

        const excelCheque = await p.cheques_emis.findFirst({
            where: {
                OR: [
                    { num_facture_caution: numFacture },
                    ...(numAvoir ? [{ num_facture_caution: numAvoir }] : [])
                ]
            },
            orderBy: { id: 'desc' }
        });

        const accessCheque = await p.cheque_details.findFirst({
            where: {
                OR: [
                    { num_fact_caution: numFacture },
                    ...(numAvoir ? [{ num_fact_caution: numAvoir }] : [])
                ]
            },
            orderBy: { id: 'desc' }
        });

        if (excelCheque) {
            dossier.banque = excelCheque.banque || dossier.banque;
            dossier.num_cheque = excelCheque.num_cheque ? String(excelCheque.num_cheque) : dossier.num_cheque;
            dossier.montant_final = excelCheque.montant || dossier.montant_final;
            if (excelCheque.date_cheque) {
                const dcStr = String(excelCheque.date_cheque);
                dossier.date_cheque = dcStr.includes('T') ? dcStr.split('T')[0] : dcStr;
            }
        } else if (accessCheque) {
            dossier.banque = accessCheque.banque || dossier.banque;
            dossier.num_cheque = accessCheque.num_cheque ? String(accessCheque.num_cheque) : dossier.num_cheque;
            dossier.montant_final = accessCheque.montant_cheque || dossier.montant_final;
            if (accessCheque.date_cheque) {
                dossier.date_cheque = accessCheque.date_cheque.toISOString().split('T')[0];
            }
            if (accessCheque.date_cloture) {
                dossier.date_cloture = accessCheque.date_cloture.toISOString().split('T')[0];
            }
        }

        return NextResponse.json({ found: true, dossier });
    } catch (error) {
        console.error('Error fetching dossier:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ numFacture: string }> }
) {
    const { numFacture } = await params;
    try {
        const body = await request.json();

        // Find the dossier first
        const dossier = await prisma.dossiers_caution.findFirst({
            where: { num_facture_caution: numFacture }
        });

        if (!dossier) {
            return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });
        }

        const updatedDossier = await prisma.dossiers_caution.update({
            where: { id: dossier.id },
            data: {
                ...body,
                updated_at: new Date()
            }
        });

        return NextResponse.json(updatedDossier);
    } catch (error) {
        console.error('Error updating dossier:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ numFacture: string }> }
) {
    const { numFacture } = await params;
    try {
        const dossier = await prisma.dossiers_caution.findFirst({
            where: { num_facture_caution: numFacture }
        });

        if (!dossier) {
            return NextResponse.json({ error: 'Dossier non trouvé' }, { status: 404 });
        }

        await prisma.dossiers_caution.delete({
            where: { id: dossier.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting dossier:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
