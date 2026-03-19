import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    // Check partenaires with default-looking FNE
    const partenaires = await prisma.partenaires.findMany({
        select: { id_partenaire: true, nom_partenaire: true, num_fne: true },
        where: { num_fne: { not: null } },
        take: 20,
        orderBy: { id_partenaire: 'asc' }
    });
    console.log('=== Sample partenaires with FNE ===');
    partenaires.forEach(p => console.log(`  ID:${p.id_partenaire} | FNE: ${p.num_fne} | Nom: ${p.nom_partenaire}`));

    // Count total
    const totalWithFne = await prisma.partenaires.count({ where: { num_fne: { not: null } } });
    const totalWithoutFne = await prisma.partenaires.count({ where: { num_fne: null } });
    const totalEmpty = await prisma.partenaires.count({ where: { num_fne: '' } });
    console.log(`\nTotal avec FNE: ${totalWithFne}`);
    console.log(`Total sans FNE (null): ${totalWithoutFne}`);
    console.log(`Total FNE vide (''): ${totalEmpty}`);

    // Check for patterns like AUTO-, DEFAULT, 0, etc.
    const autoFne = await prisma.partenaires.count({ where: { num_fne: { startsWith: 'AUTO' } } });
    const zeroFne = await prisma.partenaires.count({ where: { num_fne: '0' } });
    const dashFne = await prisma.partenaires.count({ where: { num_fne: '-' } });
    console.log(`\nFNE commençant par AUTO: ${autoFne}`);
    console.log(`FNE = '0': ${zeroFne}`);
    console.log(`FNE = '-': ${dashFne}`);

    // Also check clients table
    const clients = await prisma.clients.findMany({
        select: { id_client: true, nom_client: true, num_fne: true },
        take: 10,
        orderBy: { id_client: 'asc' }
    });
    console.log('\n=== Sample clients ===');
    clients.forEach(c => console.log(`  ID:${c.id_client} | FNE: ${c.num_fne} | Nom: ${c.nom_client}`));
}

main().catch(console.error).finally(() => prisma.$disconnect());
