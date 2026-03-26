import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
dotenv.config()

const prisma = new PrismaClient()

async function main() {
  console.log("Mise à jour du dossier fi41600990 -> FI41600990...")
  
  const dossier = await prisma.dossiers_caution.findFirst({
    where: { num_facture_caution: "fi41600990" }
  })

  if (dossier) {
    const updated = await prisma.dossiers_caution.update({
      where: { id: dossier.id },
      data: { num_facture_caution: "FI41600990" }
    })
    console.log("Succès ! Nouveau numéro :", updated.num_facture_caution)
  } else {
    console.log("Dossier fi41600990 non trouvé (déjà en majuscule ?)")
    const check = await prisma.dossiers_caution.findFirst({
      where: { num_facture_caution: "FI41600990" }
    })
    if (check) {
      console.log("Le dossier est déjà en majuscule.")
    } else {
      console.log("Dossier introuvable sous les deux formes.")
    }
  }
}

main().finally(() => prisma.$disconnect())
