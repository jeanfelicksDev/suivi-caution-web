import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const armateurs = ['ARKAS', 'GSL', 'MSC', 'CMA CGM', 'MAERSK', 'OOCL'];
    for (const nom of armateurs) {
        await prisma.armateurs.upsert({
            where: { nom },
            update: {},
            create: { nom },
        });
    }
    console.log(`✅ ${armateurs.length} armateurs insérés.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
