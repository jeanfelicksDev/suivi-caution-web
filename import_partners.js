const { PrismaClient } = require('@prisma/client');
const XLSX = require('xlsx');
const path = require('path');

// Connexion explicite à Neon PostgreSQL
const DATABASE_URL = "postgresql://neondb_owner:npg_VmsL9fEQ6pZj@ep-jolly-recipe-aldunwcu-pooler.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require";

const prisma = new PrismaClient({
    datasources: {
        db: { url: DATABASE_URL }
    }
});

const filePath = path.join(__dirname, 'LISTE DES COMPTES CLIENTS COMPTANTS.xlsx');

async function main() {
    console.log('Reading Excel file...');
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    // Les données commencent à la ligne 4 (index 4) : SOCIETE | NUMERO DE COMPTE
    const dataRows = rows.slice(4).filter(r => r[0]);
    console.log(`Found ${dataRows.length} partners to process.`);

    let created = 0, updated = 0;

    for (const row of dataRows) {
        const nom = String(row[0] || '').trim();
        const fne = String(row[1] || '').trim();
        if (!nom) continue;

        const existing = await prisma.partenaires.findFirst({
            where: { nom_partenaire: { equals: nom, mode: 'insensitive' } }
        });

        if (existing) {
            await prisma.partenaires.update({
                where: { id: existing.id },
                data: { num_fne: fne, updated_at: new Date() }
            });
            updated++;
            process.stdout.write(`\rMis à jour: ${updated} | Créés: ${created}`);
        } else {
            await prisma.partenaires.create({
                data: { nom_partenaire: nom, num_fne: fne, est_client: 1 }
            });
            created++;
            process.stdout.write(`\rMis à jour: ${updated} | Créés: ${created}`);
        }
    }

    console.log(`\n\nImport terminé ✓`);
    console.log(`  ➔ ${created} nouveau(x) partenaire(s) créé(s)`);
    console.log(`  ➔ ${updated} partenaire(s) mis à jour (FNE)`);
}

main()
    .catch(e => { console.error('\nErreur:', e.message); process.exit(1); })
    .finally(() => prisma.$disconnect());
