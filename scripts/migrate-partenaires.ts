import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrate() {
    console.log('🚀 Démarrage de la migration des partenaires...');

    // 1. Récupérer les clients
    const clients = await prisma.clients.findMany();
    console.log(`📦 ${clients.length} clients trouvés.`);

    for (const client of clients) {
        await prisma.partenaires.upsert({
            where: { num_fne: client.num_fne },
            update: {
                nom_partenaire: client.nom_client,
                est_client: 1,
            },
            create: {
                num_fne: client.num_fne,
                nom_partenaire: client.nom_client,
                est_client: 1,
                est_transitaire: 0,
            },
        });
    }

    // 2. Récupérer les transitaires
    const transitaires = await prisma.transitaires.findMany();
    console.log(`📦 ${transitaires.length} transitaires trouvés.`);

    for (const trans of transitaires) {
        await prisma.partenaires.upsert({
            where: { num_fne: trans.num_fne_transitaire },
            update: {
                nom_partenaire: trans.nom_transitaire,
                est_transitaire: 1,
            },
            create: {
                num_fne: trans.num_fne_transitaire,
                nom_partenaire: trans.nom_transitaire,
                est_client: 0,
                est_transitaire: 1,
            },
        });
    }

    console.log('✅ Migration terminée avec succès.');
}

migrate()
    .catch((e) => {
        console.error('❌ Erreur lors de la migration:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
