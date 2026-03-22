const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

prisma.dossiers_caution.updateMany({
    where: { num_facture_caution: 'FI01510674' },
    data: {
        num_cheque: '1643150',
        date_cheque: '2026-03-09',
        date_cloture: '2026-03-09',
        date_retour_compta: '2026-03-09'
    }
}).then(res => {
    console.log("Fixed FI01510674:", res);
}).finally(() => prisma.$disconnect());
