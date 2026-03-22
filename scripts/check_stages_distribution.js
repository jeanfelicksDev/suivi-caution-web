
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ETAPE_FIELDS = [
    'date_reception',
    'date_transmission_ligne',
    'date_mise_litige',
    'date_trans_sce_detention',
    'date_mise_avoir',
    'date_trans_rec',
    'date_suspendu',
    'date_1er_signature',
    'date_2e_signature',
    'date_piece_caisse',
    'date_transmission_compta',
    'date_cheque',
    'date_cloture',
];

async function main() {
    const stats = {};
    for (const field of ETAPE_FIELDS) {
        stats[field] = await prisma.dossiers_caution.count({
            where: { [field]: { not: null, not: '' } }
        });
    }

    console.log('Stage distribution:');
    console.table(stats);

    // Also check for any 'type_remboursement' differences
    const types = await prisma.dossiers_caution.groupBy({
        by: ['type_remboursement'],
        _count: true
    });
    console.log('Types distribution:', types);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
