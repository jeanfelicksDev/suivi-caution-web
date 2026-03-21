import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapping : type → { dateDebut, dateFin }
const TYPES_CONFIG: Record<string, { dateDebut: string; dateFin: string; label: string; readOnly?: boolean }> = {
    reception: { dateDebut: 'date_reception', dateFin: 'date_transmission_ligne', label: 'Traitement Réception' },
    armateur: { dateDebut: 'date_transmission_ligne', dateFin: 'date_retour_ligne', label: 'Chez Armateur' },
    litige: { dateDebut: 'date_mise_litige', dateFin: 'date_fin_litige', label: 'Litige sans détention' },
    detention: { dateDebut: 'date_trans_sce_detention', dateFin: 'date_1er_signature', label: 'Sce Détention' },
    avoir: { dateDebut: 'date_mise_avoir', dateFin: 'date_fin_avoir', label: 'Traitement Avoirs' },
    recouvrement: { dateDebut: 'date_trans_rec', dateFin: 'date_ret_rec', label: 'Sce Recouvrement' },
    suspension: { dateDebut: 'date_suspendu', dateFin: 'date_fin_suspension', label: 'Remboursement suspendue' },
    signature1: { dateDebut: 'date_1er_signature', dateFin: 'date_retour_1er_signature', label: '1ère Signature' },
    signature2: { dateDebut: 'date_2e_signature', dateFin: 'date_retour_2e_signature', label: '2ème Signature' },
    caisse: { dateDebut: 'date_piece_caisse', dateFin: 'date_transmission_compta', label: 'Pièce de Caisse' },
    compta: { dateDebut: 'date_transmission_compta', dateFin: 'date_cheque', label: 'Traitement Compta' },
    cheque: { dateDebut: 'date_cheque', dateFin: 'date_cloture', label: 'Chèque émis' },
    cloture_manuel: { dateDebut: 'date_cloture', dateFin: '__none__', label: 'Clôturé sans chèque', readOnly: true },
};

// GET /api/attente?type=armateur
// Retourne les dossiers où dateDebut est renseigné et dateFin est null/vide
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (!type || !TYPES_CONFIG[type]) {
        return NextResponse.json({ error: 'Type invalide' }, { status: 400 });
    }

    const config = TYPES_CONFIG[type];

    try {
        const allDossiers = await prisma.dossiers_caution.findMany({
            select: {
                id: true,
                num_facture_caution: true,
                date_transmission_ligne: true,
                date_retour_ligne: true,
                date_mise_litige: true,
                date_fin_litige: true,
                date_mise_avoir: true,
                date_fin_avoir: true,
                date_1er_signature: true,
                date_retour_1er_signature: true,
                date_2e_signature: true,
                date_retour_2e_signature: true,
                date_transmission_compta: true,
                armateur: true,
                client_nom: true,
                date_cheque: true,
                num_cheque: true,
                date_cloture: true,
                date_suspendu: true,
                date_fin_suspension: true,
                date_trans_sce_detention: true,
                date_trans_rec: true,
                date_ret_rec: true,
                date_piece_caisse: true,
            },
        });

        // Dossier clôturé avec chèque ou en cours de paiement
        const isChequeEmis = (d: typeof allDossiers[0]) =>
            !!(d.date_cheque?.trim());

        // Dossier clôturé manuellement
        const isClotureManuel = (d: typeof allDossiers[0]) =>
            !!(d.date_cloture?.trim());

        // Cas spécial : cloture_manuel — on liste uniquement les dossiers avec date_cloture
        // (et sans chèque émis, car ceux-là ont leur propre catégorie)
        if (config.readOnly) {
            const filtered = allDossiers.filter((d) =>
                isClotureManuel(d) && !isChequeEmis(d)
            );
            const result = filtered.map((d) => ({
                id: d.id,
                num_facture_caution: d.num_facture_caution,
                date_debut: d.date_cloture,
                date_fin: null,
                label_debut: 'date_cloture',
                label_fin: '__none__',
                armateur: d.armateur,
                client_nom: d.client_nom,
            }));
            return NextResponse.json({ dossiers: result, config });
        }

        // Filtrer : dateDebut renseigné ET dateFin vide/null
        // Exclusion : dossier clôturé avec chèque émis OU clôture manuelle
        const filtered = allDossiers.filter((d) => {
            if (isChequeEmis(d)) return false;    // chèque émis → exclu
            if (isClotureManuel(d)) return false; // clôture manuelle → exclu

            const debut = (d as Record<string, unknown>)[config.dateDebut] as string | null;
            const fin = (d as Record<string, unknown>)[config.dateFin] as string | null;
            return debut && debut.trim() !== '' && (!fin || fin.trim() === '');
        });

        const result = filtered.map((d) => ({
            id: d.id,
            num_facture_caution: d.num_facture_caution,
            date_debut: (d as Record<string, unknown>)[config.dateDebut] as string,
            date_fin: (d as Record<string, unknown>)[config.dateFin] as string | null,
            label_debut: config.dateDebut,
            label_fin: config.dateFin,
            armateur: d.armateur,
            client_nom: d.client_nom,
            date_suspendu: d.date_suspendu ?? null,
            date_fin_suspension: d.date_fin_suspension ?? null,
        }));

        return NextResponse.json({ dossiers: result, config });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

// PUT /api/attente
// Body: { type, ids, date_fin }
// Met à jour le champ dateFin pour tous les ids donnés
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { type, ids, date_fin } = body;

        if (!type || !TYPES_CONFIG[type] || !ids || !Array.isArray(ids) || !date_fin) {
            return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
        }

        const config = TYPES_CONFIG[type];

        await prisma.dossiers_caution.updateMany({
            where: { id: { in: ids } },
            data: {
                [config.dateFin]: date_fin,
                updated_at: new Date(),
            },
        });

        return NextResponse.json({ success: true, updated: ids.length });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
