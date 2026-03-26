import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/** GET /api/cheques/listes
 *  - Sans paramètre : liste de tous les lots (Excel + Access)
 *  - Avec ?listId=xxx  : retourne tous les chèques de cette liste
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('listId')?.trim() || '';

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = prisma as any;
        console.log('GET /api/cheques/listes called, listId:', listId);

        if (listId) {
            if (listId.startsWith('excel_')) {
                const date = listId.replace('excel_', '');
                const rows = await p.cheques_emis.findMany({
                    where: { date_liste_recu: date },
                    orderBy: { id: 'asc' },
                });
                return NextResponse.json(rows);
            } else if (listId.startsWith('access_')) {
                const numDispo = parseInt(listId.replace('access_', ''), 10);
                const rows = await p.cheque_details.findMany({
                    where: { num_dispo_cheque: numDispo },
                    orderBy: { id: 'asc' },
                });

                // Retrieve matching dossiers to get mandataire and client names
                const factures = rows.map((r: any) => r.num_fact_caution).filter(Boolean);
                const dossiers = await p.dossiers_caution.findMany({
                    where: { num_facture_caution: { in: factures } },
                    select: { num_facture_caution: true, mandataire_nom: true, client_nom: true, transitaire_nom: true }
                });

                const dossierMap = new Map();
                for (const d of dossiers) {
                    if (d.num_facture_caution) {
                        dossierMap.set(d.num_facture_caution, d);
                    }
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                return NextResponse.json(rows.map((r: any) => {
                    const dInfo = r.num_fact_caution ? dossierMap.get(r.num_fact_caution) : null;
                    return {
                        id: r.id,
                        num_facture_caution: r.num_fact_caution,
                        num_cheque: r.num_cheque,
                        montant: r.montant_cheque,
                        banque: r.banque,
                        date_cheque: r.date_cheque ? r.date_cheque.toISOString().split('T')[0] : null,
                        date_rex: dInfo?.mandataire_nom || null,
                        beneficiaire: dInfo?.client_nom || dInfo?.transitaire_nom || null,
                        commentaire: r.date_cloture ? `Date Clôture: ${r.date_cloture.toISOString().split('T')[0]}` : null,
                    };
                }));
            }
            return NextResponse.json([]);
        }

        // Listes Excel
        const groupedExcel = await p.cheques_emis.groupBy({
            by: ['date_liste_recu'],
            _count: { id: true },
            where: {
                date_liste_recu: { not: null }
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const excelLists = groupedExcel.map((g: any) => ({
            id: `excel_${g.date_liste_recu}`,
            label: `Liste du ${g.date_liste_recu}`,
            count: g._count.id,
            sortDate: new Date(g.date_liste_recu || '1970-01-01').getTime()
        })).filter((l: any) => l.count > 0);

        // Listes Access
        const dispos = await p.cheque_disponible.findMany({
            orderBy: { date_cheqq: 'desc' }
        });

        // Pour compter les chèques par dispo
        const groupedAccess = await p.cheque_details.groupBy({
            by: ['num_dispo_cheque'],
            _count: { id: true }
        });
        const accessCounts: Record<number, number> = {};
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        groupedAccess.forEach((g: any) => {
            if (g.num_dispo_cheque != null) {
                accessCounts[g.num_dispo_cheque] = g._count.id;
            }
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const accessLists = dispos.map((d: any) => {
            const dateStr = d.date_cheqq ? d.date_cheqq.toISOString().split('T')[0] : '';
            return {
                id: `access_${d.num_dispo_cheque}`,
                label: `Dispo N°${d.num_dispo_cheque} ${dateStr ? '(' + dateStr + ')' : ''}`,
                count: accessCounts[d.num_dispo_cheque] || 0,
                sortDate: d.date_cheqq ? d.date_cheqq.getTime() : 0
            };
        }).filter((l: any) => l.count > 0);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allLists = [...excelLists, ...accessLists].sort((a: any, b: any) => b.sortDate - a.sortDate);

        return NextResponse.json(allLists);
    } catch (error) {
        console.error('Error fetching cheques listes:', error);
        return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
    }
}

/** DELETE /api/cheques/listes
 *  - ?listId=xxx : supprime tout un lot
 *  - ?id=xxx     : supprime un chèque précis (facultatif si on veut plus fin)
 */
export async function DELETE(request: Request) {
    const { searchParams } = new URL(request.url);
    const listId = searchParams.get('listId')?.trim() || '';
    const chequeId = searchParams.get('id')?.trim() || '';

    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const p = prisma as any;

        if (listId) {
            if (listId.startsWith('excel_')) {
                const date = listId.replace('excel_', '');
                
                // 1. Récupérer les factures concernées avant de supprimer
                const impactedCheques = await p.cheques_emis.findMany({
                    where: { date_liste_recu: date },
                    select: { num_facture_caution: true }
                });
                const factures = impactedCheques.map((c: any) => c.num_facture_caution).filter(Boolean);

                // 2. Nettoyer les dossiers correspondants
                if (factures.length > 0) {
                    await prisma.dossiers_caution.updateMany({
                        where: { num_facture_caution: { in: factures } },
                        data: {
                            num_cheque: null,
                            banque: null,
                            date_cheque: null,
                            montant_final: null,
                            date_retour_compta: null,
                            date_cloture: null,
                            updated_at: new Date()
                        }
                    });
                }

                // 3. Supprimer les chèques
                await p.cheques_emis.deleteMany({
                    where: { date_liste_recu: date }
                });
                return NextResponse.json({ success: true, message: `Liste Excel du ${date} supprimée.` });
            } else if (listId.startsWith('access_')) {
                const numDispo = parseInt(listId.replace('access_', ''), 10);

                // Même chose pour Access
                const impactedDetails = await p.cheque_details.findMany({
                    where: { num_dispo_cheque: numDispo },
                    select: { num_facture_caution: true }
                });
                const factures = impactedDetails.map((c: any) => c.num_facture_caution).filter(Boolean);

                if (factures.length > 0) {
                    await prisma.dossiers_caution.updateMany({
                        where: { num_facture_caution: { in: factures } },
                        data: {
                            num_cheque: null,
                            banque: null,
                            date_cheque: null,
                            montant_final: null,
                            date_retour_compta: null,
                            date_cloture: null,
                            updated_at: new Date()
                        }
                    });
                }

                // Supprimer les détails d'abord
                await p.cheque_details.deleteMany({
                    where: { num_dispo_cheque: numDispo }
                });
                // Puis l'en-tête
                await p.cheque_disponible.delete({
                    where: { num_dispo_cheque: numDispo }
                });
                return NextResponse.json({ success: true, message: `Disponibilité N°${numDispo} supprimée.` });
            }
        }

        if (chequeId) {
            const id = parseInt(chequeId, 10);
            // On essaie dans les deux tables selon le contexte (pour être simple)
            try {
                await p.cheques_emis.delete({ where: { id } });
            } catch {
                try {
                    await p.cheque_details.delete({ where: { id } });
                } catch {
                    return NextResponse.json({ error: 'Chèque introuvable.' }, { status: 404 });
                }
            }
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Paramètre listId ou id manquant.' }, { status: 400 });
    } catch (error) {
        console.error('Error deleting cheques:', error);
        return NextResponse.json({ error: 'Erreur serveur lors de la suppression.' }, { status: 500 });
    }
}
