
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const totalCheques = await prisma.cheques_emis.count();
    console.log(`Total records in cheques_emis: ${totalCheques}`);

    if (totalCheques > 0) {
        const sample = await prisma.cheques_emis.findFirst({
            select: {
                num_facture_caution: true,
                date_cheque: true
            }
        });
        console.log('Sample from cheques_emis:', sample);

        // Check if this num_facture_caution exists in dossiers_caution
        if (sample.num_facture_caution) {
            const dossier = await prisma.dossiers_caution.findFirst({
                where: { num_facture_caution: sample.num_facture_caution }
            });
            console.log('Corresponding dossier found:', !!dossier);
            if (dossier) {
                console.log('Dossier date_cheque:', dossier.date_cheque);
            }
        }
    }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
