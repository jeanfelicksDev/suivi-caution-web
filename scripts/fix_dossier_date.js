
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const updated = await prisma.dossiers_caution.updateMany({
    where: {
      num_facture_caution: 'FI01509420',
      date_reception: '2025-03-26'
    },
    data: {
      date_reception: '2026-03-26'
    }
  })

  console.log(`Updated ${updated.count} dossier(s).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
