import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const count = await prisma.dossiers_caution.count({ where: { armateur: 'GSL' } });
    const currentMonthCount = await prisma.dossiers_caution.count({ 
        where: { 
            armateur: 'GSL', 
            date_reception: { gte: '2026-03-01', lte: '2026-03-31' } 
        } 
    });
    console.log({ totalGSL: count, inMarch: currentMonthCount });
}
main();
