import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const matchPartenaires = await prisma.partenaires.findMany({ where: { nom_partenaire: { contains: 'ECO' } } });
    console.log('Match Partenaires ECO:', matchPartenaires.map(p => p.nom_partenaire));

    const countClient = await prisma.dossiers_caution.count({ where: { client_nom: { contains: 'ECOCAJOU' } } });
    console.log('In dossiers (client) ECOCAJOU:', countClient);

    const countTrans = await prisma.dossiers_caution.count({ where: { transitaire_nom: { contains: 'ECOCAJOU' } } });
    console.log('In dossiers (trans) ECOCAJOU:', countTrans);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
