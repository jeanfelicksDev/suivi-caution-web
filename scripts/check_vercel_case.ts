import { PrismaClient } from '@prisma/client'
import * as dotenv from 'dotenv'
dotenv.config()

const prisma = new PrismaClient()

async function main() {
  const d = await prisma.dossiers_caution.findMany({
    where: {
      OR: [
        { num_facture_caution: "FI41600990" },
        { num_facture_caution: "fi41600990" }
      ]
    }
  })
  console.log("Dossiers found in Vercel:", JSON.stringify(d, null, 2))
}

main().finally(() => prisma.$disconnect())
