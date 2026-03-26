import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const dmdt = await prisma.facture_dmdt.findMany({
    where: { num_facture_caution: "fi41600990" }
  })
  console.log("Détentions (Vercel) for fi41600990:", JSON.stringify(dmdt, null, 2))
}

main().finally(() => prisma.$disconnect())
