const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const excelCount = await prisma.cheques_emis.count();
  console.log('Excel cheques count:', excelCount);
}
main().finally(() => prisma.$disconnect());
