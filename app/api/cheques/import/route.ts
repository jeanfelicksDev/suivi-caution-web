import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface ChequeRow {
  date_liste_recu?: string;
  num_facture_caution?: string;
  num_cheque?: string;
  montant?: number | string;
  banque?: string;
  date_cheque?: string;
  date_rex?: string;
  beneficiaire?: string;
  commentaire?: string;
}

/** POST /api/cheques/import — Reçoit un tableau JSON parsé depuis Excel et l'insère */
export async function POST(request: Request) {
  try {
    const body: ChequeRow[] = await request.json();

    if (!Array.isArray(body) || body.length === 0) {
      return NextResponse.json({ error: 'Aucune donnée reçue.' }, { status: 400 });
    }

    const rejectedRows: any[] = [];
    let inserted = 0;
    let skipped = 0;
    const errors: string[] = [];

    // Récupérer tous les num_facture_caution existants dans dossiers_caution pour accélérer la vérification
    const allFactures = body.map(r => r.num_facture_caution?.toString().trim()).filter(Boolean) as string[];
    const existingFolders = await prisma.dossiers_caution.findMany({
      where: { num_facture_caution: { in: allFactures } },
      select: { num_facture_caution: true, id: true }
    });
    
    const folderMap = new Map();
    for (const f of existingFolders) {
        if (f.num_facture_caution) folderMap.set(f.num_facture_caution, f.id);
    }

    for (const row of body) {
      const numFacture = row.num_facture_caution?.toString().trim();
      const dateListeRecu = row.date_liste_recu?.toString().trim() || null;

      if (!numFacture) { 
          skipped++; 
          continue; 
      }

      // Vérifier si le dossier existe
      if (!folderMap.has(numFacture)) {
          rejectedRows.push({
              num_facture: numFacture,
              num_cheque: row.num_cheque,
              montant: row.montant,
              motif: "Dossier introuvable dans la base de données"
          });
          continue;
      }

      // Vérification des doublons (Même facture, même chèque, même date)
      const existingCheque = await prisma.cheques_emis.findFirst({
        where: {
          num_facture_caution: numFacture,
          num_cheque: row.num_cheque?.toString().trim(),
          date_liste_recu: dateListeRecu
        }
      });

      if (existingCheque) {
          skipped++;
          continue;
      }

      try {
        const dossierId = folderMap.get(numFacture);

        // Insérer dans cheques_emis
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma as any).cheques_emis.create({
          data: {
            date_liste_recu: dateListeRecu,
            num_facture_caution: numFacture,
            num_cheque: row.num_cheque?.toString().trim() || null,
            montant: row.montant != null ? parseFloat(String(row.montant)) : null,
            banque: row.banque?.toString().trim() || null,
            date_cheque: row.date_cheque?.toString().trim() || null,
            date_rex: row.date_rex?.toString().trim() || null,
            beneficiaire: row.beneficiaire?.toString().trim() || null,
            commentaire: row.commentaire?.toString().trim() || null,
            imported_at: new Date(),
          },
        });

        // Mettre à jour le dossier caution
        await prisma.dossiers_caution.update({
          where: { id: dossierId },
          data: {
            num_cheque: row.num_cheque?.toString().trim() || undefined,
            banque: row.banque?.toString().trim() || undefined,
            date_cheque: row.date_cheque?.toString().trim() || undefined,
            montant_final: row.montant != null ? parseFloat(String(row.montant)) : undefined,
            updated_at: new Date(),
          },
        });

        inserted++;
      } catch (err) {
        errors.push(`${numFacture} : ${err}`);
      }
    }

    return NextResponse.json({ 
        inserted, 
        skipped, 
        errors,
        rejected: rejectedRows 
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json({ error: 'Erreur serveur lors de l\'import.' }, { status: 500 });
  }
}
