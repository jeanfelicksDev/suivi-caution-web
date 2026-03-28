
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  const dossier = await prisma.dossiers_caution.findMany({
    where: {
      num_facture_caution: {
        contains: 'FI01504643',
        mode: 'insensitive',
      },
    },
  })

  console.log(JSON.stringify(dossier, null, 2))
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
