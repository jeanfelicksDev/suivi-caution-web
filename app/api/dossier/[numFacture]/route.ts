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

        // Récupérer le numéro FNE du partenaire actif
        let num_fne = null;
        let nomPrincipal = dossier.transitaire_nom || dossier.client_nom;
        if (dossier.transitaire_actif === 1 && dossier.transitaire_nom) {
            nomPrincipal = dossier.transitaire_nom;
        } else if (dossier.client_actif === 1 && dossier.client_nom) {
            nomPrincipal = dossier.client_nom;
        }
        
        if (nomPrincipal) {
            const partenaire = await prisma.partenaires.findFirst({
                where: { nom_partenaire: nomPrincipal }
            });
            if (partenaire && partenaire.num_fne) {
                num_fne = partenaire.num_fne;
            } else {
                // Fallback pour les anciennes tables
                const client = await prisma.clients.findFirst({
                    where: { nom_client: nomPrincipal }
                });
                if (client && client.num_fne) {
                    num_fne = client.num_fne;
                } else {
                    const transitaire = await prisma.transitaires.findFirst({
                        where: { nom_transitaire: nomPrincipal }
                    });
                    if (transitaire && transitaire.num_fne_transitaire) {
                        num_fne = transitaire.num_fne_transitaire;
                    }
                }
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (dossier as any).num_fne = num_fne;

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

        // ─── Calcul automatique du Montant Final & Comptage ───
        let counts = { detentions: 0, recouvrements: 0 };
        try {
            const p = prisma as any;
            
            // Détentions
            const detentionsCount = await p.facture_dmdt.count({
                where: { num_facture_caution: numFacture }
            });
            const detentionsSum = await p.facture_dmdt.aggregate({
                where: { num_facture_caution: numFacture },
                _sum: { montant_facture: true }
            });
            counts.detentions = detentionsCount;
            
            // Recouvrements
            let recouvrementSum = 0;
            if (p.montant_recouvrer) {
                const recCount = await p.montant_recouvrer.count({
                    where: { num_facture_caution: numFacture }
                });
                const recSum = await p.montant_recouvrer.aggregate({
                    where: { num_facture_caution: numFacture },
                    _sum: { montant: true }
                });
                counts.recouvrements = recCount;
                recouvrementSum = recSum._sum.montant || 0;
            }

            const totalDetention = detentionsSum._sum.montant_facture || 0;
            dossier.montant_final = (dossier.montant_caution || 0) - totalDetention - recouvrementSum;
        } catch (calcError) {
            console.error('Erreur lors du calcul/comptage:', calcError);
        }
        // ───────────────────────────────────────────

        return NextResponse.json({ found: true, dossier, counts });
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

        // Nettoyer le body des champs calculés ou immuables
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, counts, num_fne, created_at, ...updateData } = body;

        const updatedDossier = await prisma.dossiers_caution.update({
            where: { id: dossier.id },
            data: {
                ...updateData,
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

        const p = prisma as any;
        const numAvoir = dossier.num_avoir || '';

        // 1. Supprimer les chèques (Excel)
        await p.cheques_emis.deleteMany({
            where: {
                OR: [
                    { num_facture_caution: numFacture },
                    ...(numAvoir ? [{ num_facture_caution: numAvoir }] : [])
                ]
            }
        });

        // 2. Supprimer les détails de chèques (Access)
        await p.cheque_details.deleteMany({
            where: {
                OR: [
                    { num_fact_caution: numFacture },
                    ...(numAvoir ? [{ num_fact_caution: numAvoir }] : [])
                ]
            }
        });

        // 3. Supprimer les factures DMDT (Détention)
        await p.facture_dmdt.deleteMany({
            where: { num_facture_caution: numFacture }
        });

        // 4. Supprimer les montants à recouvrer
        if (p.montant_recouvrer) {
            await p.montant_recouvrer.deleteMany({
                where: { num_facture_caution: numFacture }
            });
        }

        // 5. Enfin, supprimer le dossier
        await prisma.dossiers_caution.delete({
            where: { id: dossier.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting dossier:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
