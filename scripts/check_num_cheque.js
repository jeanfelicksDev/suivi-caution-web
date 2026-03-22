
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const withNumCheque = await prisma.dossiers_caution.count({
        where: {
            OR: [
                { num_cheque: { not: null, not: '' } },
                { date_cheque: { not: null, not: '' } }
            ]
        }
    });
    console.log(`Dossiers with num_cheque OR date_cheque: ${withNumCheque}`);

    const withNumChequeOnly = await prisma.dossiers_caution.count({
        where: {
            num_cheque: { not: null, not: '' },
            date_cheque: { equals: null }
        }
    });
    console.log(`Dossiers with num_cheque ONLY: ${withNumChequeOnly}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
