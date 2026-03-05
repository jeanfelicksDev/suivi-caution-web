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
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const excelLists = groupedExcel.map((g: any) => ({
            id: `excel_${g.date_liste_recu}`,
            label: `Liste du ${g.date_liste_recu}`,
            count: g._count.id,
            sortDate: new Date(g.date_liste_recu || '1970-01-01').getTime()
        }));

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
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const allLists = [...excelLists, ...accessLists].sort((a: any, b: any) => b.sortDate - a.sortDate);

        return NextResponse.json(allLists);
    } catch (error) {
        console.error('Error fetching cheques listes:', error);
        return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
    }
}
