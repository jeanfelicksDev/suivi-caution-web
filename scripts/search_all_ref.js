
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const result = {}
  
  result.dossiers = await prisma.dossiers_caution.findMany({
    where: { num_facture_caution: 'FI01509420' }
  })
  
  result.cheques_emis = await prisma.cheques_emis.findMany({
    where: { num_facture_caution: 'FI01509420' }
  })
  
  result.facture_dmdt = await prisma.facture_dmdt.findMany({
    where: { num_facture_caution: 'FI01509420' }
  })

  result.montant_recouvrer = await prisma.montant_recouvrer.findMany({
    where: { num_facture_caution: 'FI01509420' }
  })

  console.log(JSON.stringify(result, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
