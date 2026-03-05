import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // ECOCAJOU is missing entirely from the system. Add it as a new Client!
    const ecocajou = await prisma.partenaires.create({
        data: {
            nom_partenaire: 'ECOCAJOU',
            est_client: 1,
            est_transitaire: 0,
        }
    });

    console.log('Partenaire ECOCAJOU créé avec succès:', ecocajou);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
