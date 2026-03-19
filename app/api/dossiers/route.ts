import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Séquence ordonnée des champs de dates représentant les étapes d'un dossier.
 * Un dossier est à l'étape N si sa date N est remplie ET toutes les dates
 * suivantes (N+1…) sont nulles.
 */
const ETAPE_FIELDS = [
    'date_reception',          // Dossier Reçu
    'date_transmission_ligne', // Dossier Chez Armateur
    'date_retour_ligne',       // Dossier Retour Ligne
    'date_mise_litige',        // Dossier En Litige
    'date_suspendu',           // Dossier Suspendu
    'date_piece_caisse',       // Dossier Pour Avoir
    'date_1er_signature',      // Dossier En Signature 1
    'date_2e_signature',       // Dossier En Signature 2
    'date_cloture',            // Dossier Clôture Manuel
    'date_transmission_compta',// Dossier À la Compta
    'date_cheque',             // Chèque Émis – Dossier Clôturé
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
            const idx = ETAPE_FIELDS.indexOf(etape as EtapeField);
            // La date de l'étape sélectionnée doit être remplie
            etapeWhere[etape] = { not: null };
            // Toutes les étapes SUIVANTES doivent être nulles (dossier bloqué ici)
            for (let j = idx + 1; j < ETAPE_FIELDS.length; j++) {
                etapeWhere[ETAPE_FIELDS[j]] = null;
            }
        }

        // Filtre période réception
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dateReceptionWhere: Record<string, any> = {};
        if (dateFrom || dateTo) {
            dateReceptionWhere['date_reception'] = {};
            if (dateFrom) dateReceptionWhere['date_reception']['gte'] = dateFrom;
            if (dateTo) dateReceptionWhere['date_reception']['lte'] = dateTo;
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
                ...dateReceptionWhere,
                ...(!hasFilters && { date_cloture: null, date_cheque: null }),
            },
            select: {
                id: true,
                num_facture_caution: true,
                num_bl: true,
                montant_caution: true,
                armateur: true,
                client_nom: true,
                transitaire_nom: true,
                date_reception: true,
                date_transmission_ligne: true,
                date_mise_litige: true,
                date_retour_ligne: true,
                date_suspendu: true,
                date_fin_suspension: true,
                date_piece_caisse: true,
                date_1er_signature: true,
                date_2e_signature: true,
                date_cloture: true,
                date_transmission_compta: true,
                date_cheque: true,
            },
            orderBy: [{ date_reception: 'desc' }, { created_at: 'desc' }],
        });

        return NextResponse.json(dossiers);
    } catch (error) {
        console.error('Error fetching dossiers:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
