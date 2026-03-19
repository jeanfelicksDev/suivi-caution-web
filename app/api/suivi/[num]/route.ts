import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, context: { params: Promise<{ num: string }> }) {
  try {
    const params = await context.params;
    const numFacture = params.num.toUpperCase().trim();
    if (!numFacture) {
      return NextResponse.json({ found: false, error: "Numéro requis" }, { status: 400 });
    }

    const dossier = await prisma.dossiers_caution.findFirst({
      where: { num_facture_caution: numFacture },
      select: {
        num_facture_caution: true,
        date_reception: true,
        date_1er_signature: true,
        date_2e_signature: true,
        date_transmission_compta: true,
        date_retour_compta: true,
        date_cheque: true,
        date_suspendu: true,
        date_fin_suspension: true,
      }
    });

    if (!dossier) {
      return NextResponse.json({ found: false });
    }

    let statut_code = 0;
    let statut_text = '';

    const isSuspended = dossier.date_suspendu && !dossier.date_fin_suspension;

    if (dossier.date_cheque) {
      statut_code = 5;
      statut_text = 'Chèque dispo';
    } else if (dossier.date_transmission_compta || dossier.date_retour_compta) {
      statut_code = 4;
      statut_text = 'A la compta';
    } else if (dossier.date_1er_signature || dossier.date_2e_signature) {
      statut_code = 3;
      statut_text = 'A la Signature';
    } else if (dossier.date_reception) {
      statut_code = 2; 
      statut_text = isSuspended ? 'Dossier suspendu' : 'En traitement';
    } else {
      statut_code = 1; 
      statut_text = 'Réception';
    }

    const durations: Record<string, number | null> = {
      en_traitement: null,
      a_la_signature: null,
      a_la_compta: null,
    };

    const diffDays = (d1: string | null, d2: string | null) => {
      if (!d1) return null;
      const start = new Date(d1);
      const end = d2 ? new Date(d2) : new Date();
      const diffTime = end.getTime() - start.getTime();
      return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    };

    if (dossier.date_reception) {
      durations.en_traitement = diffDays(dossier.date_reception, dossier.date_1er_signature || dossier.date_2e_signature);
    }
    if (dossier.date_1er_signature || dossier.date_2e_signature) {
      durations.a_la_signature = diffDays(dossier.date_1er_signature || dossier.date_2e_signature, dossier.date_transmission_compta || dossier.date_retour_compta);
    }
    if (dossier.date_transmission_compta || dossier.date_retour_compta) {
      durations.a_la_compta = diffDays(dossier.date_transmission_compta || dossier.date_retour_compta, dossier.date_cheque);
    }

    return NextResponse.json({
      found: true,
      data: dossier,
      statut_code,
      statut_text,
      durations
    });
  } catch (error) {
    console.error('Erreur API Suivi:', error);
    return NextResponse.json({ found: false, error: 'Erreur Serveur' }, { status: 500 });
  }
}
