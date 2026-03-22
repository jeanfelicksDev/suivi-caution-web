
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    // 1. Check cheque_details
    const details = await prisma.cheque_details.findMany({
        where: { num_fact_caution: { not: null, not: '' } },
        select: { num_fact_caution: true, num_cheque: true, date_cheque: true, banque: true, montant_cheque: true }
    });
    console.log(`Matching records in cheque_details: ${details.length}`);

    // Map by num_facture
    const detailsMap = new Map();
    details.forEach(it => {
        if (it.num_fact_caution) detailsMap.set(it.num_fact_caution, it);
    });

    // 2. Check cheques_emis
    const emis = await prisma.cheques_emis.findMany({
        where: { num_facture_caution: { not: null, not: '' } },
        select: { num_facture_caution: true, num_cheque: true, date_cheque: true, banque: true, montant: true }
    });
    console.log(`Matching records in cheques_emis: ${emis.length}`);

    // Map by num_facture
    const emisMap = new Map();
    emis.forEach(it => {
        if (it.num_facture_caution) emisMap.set(it.num_facture_caution, it);
    });

    // 3. Check dossiers_caution without date_cheque but with a match
    const dossiersToUpdate = await prisma.dossiers_caution.findMany({
        where: {
            OR: [
                { date_cheque: null },
                { date_cheque: '' }
            ]
        },
        select: { id: true, num_facture_caution: true }
    });

    let countFromDetails = 0;
    let countFromEmis = 0;

    for (const d of dossiersToUpdate) {
        if (!d.num_facture_caution) continue;
        if (detailsMap.has(d.num_facture_caution)) countFromDetails++;
        else if (emisMap.has(d.num_facture_caution)) countFromEmis++;
    }

    console.log(`Dossiers to update from cheque_details: ${countFromDetails}`);
    console.log(`Dossiers to update from cheques_emis: ${countFromEmis}`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
