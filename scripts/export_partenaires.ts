import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    const partenaires = await prisma.partenaires.findMany({
        orderBy: { nom_partenaire: 'asc' }
    });

    let md = '# Liste des Partenaires\n\n';
    md += "Ce document liste l'intégralité des " + partenaires.length + " partenaires fusionnés et enregistrés.\\n\\n";
    md += '| ID | Nom du Partenaire | N° FNE | Client ? | Transitaire ? | Téléphone | Email |\n';
    md += '|---|---|---|---|---|---|---|\n';

    for (const p of partenaires) {
        const client = p.est_client === 1 ? '✅ Oui' : '➖';
        const transitaire = p.est_transitaire === 1 ? '✅ Oui' : '➖';
        const fne = p.num_fne || '—';
        const tel = p.telephone || '—';
        const email = p.email || '—';
        md += `| ${p.id_partenaire} | ${p.nom_partenaire} | ${fne} | ${client} | ${transitaire} | ${tel} | ${email} |\n`;
    }

    const artifactPath = "C:\\Users\\HP\\.gemini\\antigravity\\brain\\1ada1987-f4a5-4277-8d61-16ce18bf4ebb\\partenaires_list.md";
    fs.writeFileSync(artifactPath, md, 'utf-8');
    console.log("Artifact written to:", artifactPath);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
