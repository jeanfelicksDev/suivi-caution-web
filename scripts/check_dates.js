
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const count = await prisma.dossiers_caution.count({
    where: {
      date_reception: {
        contains: '2025-03-26'
      }
    }
  })
  console.log('Dossiers dated 2025-03-26:', count)

  const dossiers = await prisma.dossiers_caution.findMany({
    where: {
      date_reception: {
        contains: '2025-03-26'
      }
    },
    take: 10
  })
  console.log(JSON.stringify(dossiers.map(d => ({id: d.id, num_facture_caution: d.num_facture_caution, date_reception: d.date_reception})), null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
