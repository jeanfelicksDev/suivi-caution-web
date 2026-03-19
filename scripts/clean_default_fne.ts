import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    // Fix clients: give each a unique placeholder since num_fne is UNIQUE and NOT NULL
    const clientsToFix = await prisma.clients.findMany({
        where: { num_fne: { startsWith: 'CLI-' } },
        select: { id_client: true, num_fne: true }
    });
    console.log(`Clients à nettoyer: ${clientsToFix.length}`);

    for (const c of clientsToFix) {
        await prisma.clients.update({
            where: { id_client: c.id_client },
            data: { num_fne: `VIDE-${c.id_client}` }
        });
    }
    console.log(`✅ Clients: ${clientsToFix.length} FNE par défaut remplacés.`);

    // Fix transitaires
    const transitairesToFix = await prisma.transitaires.findMany({
        where: { num_fne_transitaire: { startsWith: 'TRA-' } },
        select: { id_transitaire: true, num_fne_transitaire: true }
    });
    console.log(`Transitaires à nettoyer: ${transitairesToFix.length}`);

    for (const t of transitairesToFix) {
        await prisma.transitaires.update({
            where: { id_transitaire: t.id_transitaire },
            data: { num_fne_transitaire: `VIDE-${t.id_transitaire}` }
        });
    }
    console.log(`✅ Transitaires: ${transitairesToFix.length} FNE par défaut remplacés.`);

    // Vérification partenaires
    const remaining = await prisma.partenaires.count({
        where: { OR: [{ num_fne: { startsWith: 'CLI-' } }, { num_fne: { startsWith: 'TRA-' } }] }
    });
    console.log(`\nPartenaires restants avec CLI-/TRA-: ${remaining}`);

    console.log('\n🎉 Nettoyage terminé !');
}

main().catch(console.error).finally(() => prisma.$disconnect());
