import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const data = {
  "IdCaution": 3630,
  "NumFactureCaution": "FI41600990",
  "NumBL": "GOSUOCQ8003610",
  "Armateur": "GSL",
  "DateReception": "2026-03-10",
  "Transitaire": "AGENCE GENERALE DE TRANSIT COTE D'IVOIRE",
  "Client": "DREAM CARS",
  "MontantCaution": 1000000.0,
  "ContactClient": "07 07 43 47 49",
  "DateRetourArmateur": "2026-03-05",
  "DateLitige": "2026-03-09",
  "DatePiece": "2026-03-17",
  "DateSignature1": null,
  "DateSignature2": null,
  "DateCompta": null,
  "DateFacture": "2026-01-27",
  "Mandataire": "EDOUKOU DUODU DANIEL",
  "NumPieceMandataire": "CNI CI004496901",
  "DateBAD": "2026-01-30",
  "DateSortie": "2026-01-29",
  "DateRetour": "2026-01-31",
  "TransmisDMDT": false,
  "CommantaireDMDT": null,
  "FactureAvoir": "AI41600227",
  "DossierSuspendu": false,
  "RaisonSuspendu": null,
  "NbreJFranchise": 21,
  "Nbre20": null,
  "Nbre40": 1,
  "ProposePar": "YENON RUTH",
  "CommentaireAnnul": "ANNULATION DE LA CAUTION",
  "DateClotureAutre": null,
  "CommentaireClotureAutre": null,
  "OuiNonCloture": false,
  "CocherTransitaire": true,
  "CocherClient": false,
  "CommentaireTP": null,
  "NatureRembt": null,
  "TypeDossier": "Caution",
  "ImpactMarge": 0,
  "NumCompte": "NZ080959"
}

async function main() {
  console.log(`Importation du dossier ${data.NumFactureCaution}...`)
  
  // Vérifier si le dossier existe déjà
  const existing = await prisma.dossiers_caution.findFirst({
    where: { num_facture_caution: data.NumFactureCaution }
  })

  if (existing) {
    console.log("Le dossier existe déjà dans Vercel. Mise à jour...")
    const updated = await prisma.dossiers_caution.update({
      where: { id: existing.id },
      data: {
        type_remboursement: data.TypeDossier,
        nature_rembt: data.NatureRembt,
        num_facture_caution: data.NumFactureCaution,
        montant_caution: data.MontantCaution,
        date_facture: data.DateFacture,
        num_bl: data.NumBL,
        armateur: data.Armateur,
        date_reception: data.DateReception,
        transitaire_actif: data.CocherTransitaire ? 1 : 0,
        transitaire_nom: data.Transitaire,
        client_actif: data.CocherClient ? 1 : 0,
        client_nom: data.Client,
        mandataire_nom: data.Mandataire,
        num_piece_mandataire: data.NumPieceMandataire,
        date_bad: data.DateBAD,
        date_sortie: data.DateSortie,
        date_retour: data.DateRetour,
        jours_franchise: data.NbreJFranchise,
        nbre_20: data.Nbre20,
        nbre_40: data.Nbre40,
        propose_par: data.ProposePar,
        commentaire_avoir: data.CommentaireAnnul,
        num_avoir: data.FactureAvoir,
        date_cloture: data.DateClotureAutre,
        banque: data.NumCompte,
        updated_at: new Date()
      }
    })
    console.log("Dossier mis à jour :", updated.id)
  } else {
    console.log("Le dossier n'existe pas. Création...")
    const created = await prisma.dossiers_caution.create({
      data: {
        type_remboursement: data.TypeDossier,
        nature_rembt: data.NatureRembt,
        num_facture_caution: data.NumFactureCaution,
        montant_caution: data.MontantCaution,
        date_facture: data.DateFacture,
        num_bl: data.NumBL,
        armateur: data.Armateur,
        date_reception: data.DateReception,
        transitaire_actif: data.CocherTransitaire ? 1 : 0,
        transitaire_nom: data.Transitaire,
        client_actif: data.CocherClient ? 1 : 0,
        client_nom: data.Client,
        mandataire_nom: data.Mandataire,
        num_piece_mandataire: data.NumPieceMandataire,
        date_bad: data.DateBAD,
        date_sortie: data.DateSortie,
        date_retour: data.DateRetour,
        jours_franchise: data.NbreJFranchise,
        nbre_20: data.Nbre20,
        nbre_40: data.Nbre40,
        propose_par: data.ProposePar,
        commentaire_avoir: data.CommentaireAnnul,
        num_avoir: data.FactureAvoir,
        date_cloture: data.DateClotureAutre,
        banque: data.NumCompte,
        created_at: new Date(),
        updated_at: new Date()
      }
    })
    console.log("Dossier créé :", created.id)
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
