import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log("Lecture des 5 derniers dossiers...")
  const dossiers = await prisma.dossiers_caution.findMany({
    take: 5,
    orderBy: { created_at: 'desc' }
  })
  console.log(JSON.stringify(dossiers, null, 2))
}

main()
  .catch((e) => {
    console.err(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
