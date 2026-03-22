import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Séquence ordonnée des champs de dates représentant les étapes d'un dossier.
 * Un dossier est à l'étape N si sa date N est remplie ET toutes les dates
 * suivantes (N+1…) sont nulles.
 */
const ETAPE_FIELDS = [
    'date_reception',          // Demande Reçu
    'date_transmission_ligne', // Transmission à l’armateur
    'date_mise_litige',        // Mise en Litige sans détention
    'date_trans_sce_detention',// Mise en Litige Service détention
    'date_mise_avoir',         // Traitement de l’avoir
    'date_trans_rec',          // Contrôle Sce recouvrement
    'date_suspendu',           // Remboursement suspendue
    'date_1er_signature',      // Transmission pour signature
    'date_2e_signature',       // Transmission pour 2ème signature
    'date_piece_caisse',       // Pièce de caisse établie
    'date_transmission_compta',// Transmission à la compta
    'date_cheque',             // Chèque émis
    'date_cloture',            // Clôturé sans chèque
] as const;

type EtapeField = typeof ETAPE_FIELDS[number];

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);

    const numFacture = searchParams.get('numFacture')?.trim() || '';
    const numBl = searchParams.get('numBl')?.trim() || '';
    const client = searchParams.get('client')?.trim() || '';
    const transitaire = searchParams.get('transitaire')?.trim() || '';
    const armateur = searchParams.get('armateur')?.trim() || '';
    const etape = searchParams.get('etape')?.trim() || '';
    const dateFrom = searchParams.get('dateFrom')?.trim() || '';
    const dateTo = searchParams.get('dateTo')?.trim() || '';

    try {
        // Construction du filtre "étape courante"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const etapeWhere: Record<string, any> = {};

        if (etape && (ETAPE_FIELDS as readonly string[]).includes(etape)) {
            if (etape === 'date_cheque') {
                etapeWhere['AND'] = [
                    { num_cheque: { not: null } },
                    { num_cheque: { not: '' } }
                ];
            } else if (etape === 'date_cloture') {
                etapeWhere['AND'] = [
                    { date_cloture: { not: null } },
                    { date_cloture: { not: '' } },
                    { OR: [{ num_cheque: null }, { num_cheque: '' }] }
                ];
            } else {
                const idx = ETAPE_FIELDS.indexOf(etape as EtapeField);
                
                const conditions: any[] = [
                    { [etape]: { not: null } },
                    { [etape]: { not: '' } }
                ];

                for (let j = idx + 1; j < ETAPE_FIELDS.length; j++) {
                    conditions.push({
                        OR: [
                            { [ETAPE_FIELDS[j]]: null },
                            { [ETAPE_FIELDS[j]]: '' }
                        ]
                    });
                }
                
                // Exclure les dossiers qui ont déjà leur chèque émis
                conditions.push({
                    OR: [
                        { num_cheque: null },
                        { num_cheque: '' }
                    ]
                });
                
                etapeWhere['AND'] = conditions;
            }
        }

        // 1. Détermination du champ de date pour le filtrage par période
        let dateFilterField = 'date_reception';
        if (etape && (ETAPE_FIELDS as readonly string[]).includes(etape)) {
            dateFilterField = etape;
        }

        // 2. Construction du filtre de période
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const periodWhere: Record<string, any> = {};
        if (dateFrom || dateTo) {
            periodWhere[dateFilterField] = {};
            if (dateFrom) periodWhere[dateFilterField]['gte'] = dateFrom;
            if (dateTo) periodWhere[dateFilterField]['lte'] = dateTo;
        }

        const hasFilters = Boolean(numFacture || numBl || client || transitaire || armateur || etape || dateFrom || dateTo);

        const dossiers = await prisma.dossiers_caution.findMany({
            where: {
                ...(numFacture && { num_facture_caution: { contains: numFacture } }),
                ...(numBl && { num_bl: { contains: numBl } }),
                ...(client && { client_nom: { contains: client } }),
                ...(transitaire && { transitaire_nom: { contains: transitaire } }),
                ...(armateur && { armateur: armateur }),
                ...etapeWhere,
                ...periodWhere,
            },
            select: {
                id: true,
                num_facture_caution: true,
                num_bl: true,
                montant_caution: true,
                montant_final: true,
                armateur: true,
                client_nom: true,
                transitaire_nom: true,
                date_reception: true,
                date_transmission_ligne: true,
                date_mise_litige: true,
                date_trans_sce_detention: true,
                date_mise_avoir: true,
                date_trans_rec: true,
                date_retour_ligne: true,
                date_suspendu: true,
                date_fin_suspension: true,
                date_piece_caisse: true,
                date_1er_signature: true,
                date_2e_signature: true,
                date_cloture: true,
                date_transmission_compta: true,
                date_cheque: true,
                num_cheque: true,
            },
            orderBy: [{ date_reception: 'desc' }, { created_at: 'desc' }],
        });

        return NextResponse.json(dossiers);
    } catch (error) {
        console.error('Error fetching dossiers:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
