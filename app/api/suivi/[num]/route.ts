import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request, context: { params: { num: string } }) {
  try {
    const numFacture = context.params.num.toUpperCase().trim();
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
      }
    });

    if (!dossier) {
      return NextResponse.json({ found: false });
    }

    let statut_code = 0;
    let statut_text = '';

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
      statut_text = 'En traitement';
    } else {
      statut_code = 1; 
      statut_text = 'Réception';
    }

    return NextResponse.json({
      found: true,
      data: dossier,
      statut_code,
      statut_text
    });
  } catch (error) {
    console.error('Erreur API Suivi:', error);
    return NextResponse.json({ found: false, error: 'Erreur Serveur' }, { status: 500 });
  }
}
