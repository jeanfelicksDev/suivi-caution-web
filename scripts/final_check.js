
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const dossiers = await prisma.dossiers_caution.findMany({
    where: {
      date_reception: { contains: '2025' },
      created_at: { gte: new Date('2026-03-20') }
    }
  })
  
  console.log('Dossiers detected with 2025 year but created in 2026:', JSON.stringify(dossiers.map(d => ({id: d.id, num: d.num_facture_caution, date: d.date_reception, created: d.created_at})), null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
