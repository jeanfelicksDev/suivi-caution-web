import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const cd = await prisma.cheque_details.findMany({
    where: { num_fact_caution: "fi41600990" }
  })
  console.log("Cheques (Vercel) for fi41600990:", JSON.stringify(cd, null, 2))
}

main().finally(() => prisma.$disconnect())
