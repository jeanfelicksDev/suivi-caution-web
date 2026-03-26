import { prisma } from './lib/prisma';

async function main() {
  const excelCount = await prisma.cheques_emis.count();
  const detailCount = await (prisma as any).cheque_details.count();
  const dispoCount = await (prisma as any).cheque_disponible.count();
  console.log({ excelCount, detailCount, dispoCount });
}
main();
