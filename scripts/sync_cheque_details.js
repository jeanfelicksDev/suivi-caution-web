
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Starting synchronization from cheque_details to dossiers_caution...');

    // 1. Fetch all records from cheque_details that have a matching num_fact_caution
    const details = await prisma.cheque_details.findMany({
        where: { num_fact_caution: { not: null, not: '' } },
        select: { 
            num_fact_caution: true, 
            num_cheque: true, 
            date_cheque: true, 
            banque: true, 
            montant_cheque: true,
            date_cloture: true
        }
    });

    console.log(`Found ${details.length} records in cheque_details.`);

    let updatedCount = 0;
    let errorCount = 0;

    // 2. Iterate and update dossiers_caution
    for (const row of details) {
        try {
            if (row.num_fact_caution) {
                const fmtDate = (d) => {
                    if (!d) return null;
                    if (typeof d === 'string') return d.split('T')[0];
                    if (d instanceof Date) return d.toISOString().split('T')[0];
                    return null;
                };

                const dateCheque = fmtDate(row.date_cheque);
                const dateCloture = fmtDate(row.date_cloture) || dateCheque;

                const res = await prisma.dossiers_caution.updateMany({
                    where: { num_facture_caution: row.num_fact_caution },
                    data: {
                        num_cheque: row.num_cheque || undefined,
                        banque: row.banque || undefined,
                        date_cheque: dateCheque || undefined,
                        montant_final: row.montant_cheque != null ? parseFloat(String(row.montant_cheque)) : undefined,
                        date_cloture: dateCloture || undefined,
                        date_retour_compta: dateCheque || undefined,
                        updated_at: new Date()
                    }
                });
                
                if (res.count > 0) {
                    updatedCount += res.count;
                    if (updatedCount % 500 === 0) console.log(`Processed ${updatedCount} updates...`);
                }
            }
        } catch (err) {
            console.error(`Error updating dossier ${row.num_fact_caution}:`, err);
            errorCount++;
        }
    }

    console.log(`Synchronization finished.`);
    console.log(`Successfully updated: ${updatedCount}`);
    console.log(`Errors encountered: ${errorCount}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
