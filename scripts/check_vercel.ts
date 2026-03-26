import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const search_term = "FI41600990"
  console.log(`Recherche de ${search_term} dans Vercel...`)
  
  const dossier = await prisma.dossiers_caution.findFirst({
    where: {
      OR: [
        { num_facture_caution: { contains: search_term } },
        { num_bl: { contains: search_term } },
        { num_avoir: { contains: search_term } }
      ]
    }
  })

  if (dossier) {
    console.log("Dossier trouvé dans Vercel :", dossier)
  } else {
    console.log("Dossier non trouvé dans Vercel.")
  }

  const dmdt = await prisma.facture_dmdt.findFirst({
    where: {
      OR: [
        { num_facture_dmdt: { contains: search_term } },
        { num_facture_caution: { contains: search_term } }
      ]
    }
  })

  if (dmdt) {
    console.log("Détention trouvée dans Vercel :", dmdt)
  } else {
    console.log("Détention non trouvée dans Vercel.")
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
