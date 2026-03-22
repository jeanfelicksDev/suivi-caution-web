const { PrismaClient } = require('@prisma/client');

async function main() {
  const url = process.argv[2] || process.env.DATABASE_URL;
  if (!url) throw new Error('URL required');
  const prisma = new PrismaClient({
    datasources: {
      db: { url }
    }
  });
  try {
    const count = await prisma.dossiers_caution.count();
    console.log(`Dossiers count: ${count}`);
    if (count > 0) {
      const sample = await prisma.dossiers_caution.findFirst({ select: { num_facture_caution: true } });
      console.log(`Sample dossier: ${sample.num_facture_caution}`);
    }
  } catch (err) {
    console.error(`Error: ${err.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

main();
