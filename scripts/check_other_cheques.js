
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const totalDetails = await prisma.cheque_details.count();
    console.log(`Total records in cheque_details: ${totalDetails}`);

    if (totalDetails > 0) {
        const sample = await prisma.cheque_details.findFirst();
        console.log('Sample from cheque_details:', sample);
    }

    const totalDispo = await prisma.cheque_disponible.count();
    console.log(`Total records in cheque_disponible: ${totalDispo}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
