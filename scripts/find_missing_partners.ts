import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Recherche des partenaires manquants en cours...");

    // 1. Obtenir tous les noms de partenaires existants
    const tousPartenaires = await prisma.partenaires.findMany({
        select: { nom_partenaire: true }
    });

    // Convertir en Set pour une recherche très rapide, en normalisant (majuscules, espaces supprimés au début/fin)
    const setPartenaires = new Set(
        tousPartenaires.map(p => p.nom_partenaire.trim().toUpperCase())
    );

    const dossiersClients = await prisma.dossiers_caution.findMany({
        select: { client_nom: true },
        where: { client_nom: { not: '' } },
        distinct: ['client_nom']
    });

    const dossiersTransitaires = await prisma.dossiers_caution.findMany({
        select: { transitaire_nom: true },
        where: { transitaire_nom: { not: '' } },
        distinct: ['transitaire_nom']
    });

    // 3. Identifier les manquants
    const clientsManquants = new Map<string, number>();
    const transitairesManquants = new Map<string, number>();

    for (const row of dossiersClients) {
        if (!row.client_nom) continue;
        const nomNorm = row.client_nom.trim().toUpperCase();
        if (!setPartenaires.has(nomNorm)) {
            // Compter combien de dossiers sont affectés
            const count = await prisma.dossiers_caution.count({ where: { client_nom: row.client_nom } });
            clientsManquants.set(row.client_nom, count);
        }
    }

    for (const row of dossiersTransitaires) {
        if (!row.transitaire_nom) continue;
        const nomNorm = row.transitaire_nom.trim().toUpperCase();
        if (!setPartenaires.has(nomNorm)) {
            const count = await prisma.dossiers_caution.count({ where: { transitaire_nom: row.transitaire_nom } });
            transitairesManquants.set(row.transitaire_nom, count);
        }
    }

    // 4. Affichage des résultats
    console.log("\n--- CLIENTS MANQUANTS DANS LA TABLE PARTENAIRES ---");
    if (clientsManquants.size === 0) console.log("Aucun client manquant !");
    clientsManquants.forEach((count, nom) => {
        console.log(`- ${nom} (Présent dans ${count} dossier(s))`);
    });

    console.log("\n--- TRANSITAIRES MANQUANTS DANS LA TABLE PARTENAIRES ---");
    if (transitairesManquants.size === 0) console.log("Aucun transitaire manquant !");
    transitairesManquants.forEach((count, nom) => {
        console.log(`- ${nom} (Présent dans ${count} dossier(s))`);
    });

    console.log(`\nTotal Clients uniques manquants: ${clientsManquants.size}`);
    console.log(`Total Transitaires uniques manquants: ${transitairesManquants.size}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
