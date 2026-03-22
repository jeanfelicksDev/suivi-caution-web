const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting synchronization from cheques_emis to dossiers_caution...');

    const details = await prisma.cheques_emis.findMany({
        where: { num_facture_caution: { not: null, not: '' } },
        select: { 
            num_facture_caution: true, 
            num_cheque: true, 
            date_cheque: true, 
            banque: true, 
            montant: true
        }
    });

    console.log(`Found ${details.length} records in cheques_emis.`);

    let updatedCount = 0;

    for (const row of details) {
        if (row.num_facture_caution) {
            const dateCheque = row.date_cheque; // It's already a String in schema

            const res = await prisma.dossiers_caution.updateMany({
                where: { num_facture_caution: row.num_facture_caution },
                data: {
                    num_cheque: row.num_cheque ? String(row.num_cheque) : undefined,
                    banque: row.banque || undefined,
                    date_cheque: dateCheque || undefined,
                    montant_final: row.montant != null ? parseFloat(String(row.montant)) : undefined,
                    date_cloture: dateCheque || undefined,
                    date_retour_compta: dateCheque || undefined,
                    updated_at: new Date()
                }
            });
            
            if (res.count > 0) {
                updatedCount += res.count;
                if (updatedCount % 500 === 0) console.log(`Processed ${updatedCount} updates...`);
            }
        }
    }

    console.log(`Synchronization finished.`);
    console.log(`Successfully updated: ${updatedCount}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
