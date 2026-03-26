import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const dossier = await prisma.dossiers_caution.findUnique({
    where: { id: 12083 }
  })
  console.log(JSON.stringify(dossier, null, 2))
}

main().finally(() => prisma.$disconnect())
