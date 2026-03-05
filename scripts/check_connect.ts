import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const pCount = await prisma.partenaires.count({ where: { nom_partenaire: { contains: 'CONNECT' } } });
    console.log('In partenaires:', pCount);

    const matchPartenaires = await prisma.partenaires.findMany({ where: { nom_partenaire: { contains: 'CONNECT' } } });
    console.log('Match Partenaires:', matchPartenaires.map(p => p.nom_partenaire));

    const dcClientCount = await prisma.dossiers_caution.count({ where: { client_nom: { contains: 'CONNECT' } } });
    console.log('In dossiers (client):', dcClientCount);

    const dcTransCount = await prisma.dossiers_caution.count({ where: { transitaire_nom: { contains: 'CONNECT' } } });
    console.log('In dossiers (transitaire):', dcTransCount);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
