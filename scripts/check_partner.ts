import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const c = await prisma.partenaires.findFirst({
    where: { nom_partenaire: "DREAM CARS" }
  })
  console.log("Client DREAM CARS in Vercel:", c)
}

main().finally(() => prisma.$disconnect())
