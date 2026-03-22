
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const total = await prisma.dossiers_caution.count();
    const withCheque = await prisma.dossiers_caution.count({
        where: {
            date_cheque: { not: null, not: '' }
        }
    });

    console.log(`Total dossiers: ${total}`);
    console.log(`Dossiers with date_cheque: ${withCheque}`);

    if (withCheque > 0) {
        const sample = await prisma.dossiers_caution.findFirst({
            where: {
                date_cheque: { not: null, not: '' }
            },
            select: {
                num_facture_caution: true,
                date_cheque: true,
                date_cloture: true
            }
        });
        console.log('Sample with cheque:', sample);
    }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
