import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 1. Mettre à jour le partenaire mal orthographié dans la table partenaires
    const badPartenaire = await prisma.partenaires.findFirst({
        where: { nom_partenaire: 'CONNECT GLOBAL FORWAEDING' }
    });

    if (badPartenaire) {
        await prisma.partenaires.update({
            where: { id_partenaire: badPartenaire.id_partenaire },
            data: { nom_partenaire: 'CONNECT GLOBAL FORWARDING' }
        });
        console.log('Correction orthographique dans partenaires: CONNECT GLOBAL FORWARDING');
    }

    // 2. Mettre à jour les transitaires avec l'orthographe corrigée au cas où il y a un problème similaire
    await prisma.transitaires.updateMany({
        where: { nom_transitaire: 'CONNECT GLOBAL FORWAEDING' },
        data: { nom_transitaire: 'CONNECT GLOBAL FORWARDING' }
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
