import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("=== DÉBUT DES CORRECTIONS ===");

    // 1. Corriger l'orthographe dans les dossiers bruts
    const { count } = await prisma.dossiers_caution.updateMany({
        where: { transitaire_nom: 'CONNECT GLOBAL FORWAEDING' },
        data: { transitaire_nom: 'CONNECT GLOBAL FORWARDING' }
    });
    console.log(`Corrigé ${count} dossier(s) avec la faute "CONNECT GLOBAL FORWAEDING".`);

    // 2. Extraire la liste complète existante pour vérifier facilement
    const tousPartenaires = await prisma.partenaires.findMany({
        select: { nom_partenaire: true }
    });
    const setPartenaires = new Set(tousPartenaires.map(p => p.nom_partenaire.trim().toUpperCase()));

    // 3. Importer les Clients manquants
    const dossiersClients = await prisma.dossiers_caution.findMany({
        select: { client_nom: true },
        where: { client_nom: { not: '' } },
        distinct: ['client_nom']
    });

    let clientsAjoutes = 0;
    for (const row of dossiersClients) {
        if (!row.client_nom) continue;
        const nomNorm = row.client_nom.trim().toUpperCase();

        if (!setPartenaires.has(nomNorm)) {
            // Création du client manquant
            await prisma.partenaires.create({
                data: {
                    nom_partenaire: row.client_nom,
                    est_client: 1,
                    est_transitaire: 0,
                }
            });
            setPartenaires.add(nomNorm); // L'ajouter pour pas le recompter si besoin
            clientsAjoutes++;
            console.log(`[+] Client ajouté : ${row.client_nom}`);
        }
    }

    // 4. Importer les Transitaires manquants
    const dossiersTransitaires = await prisma.dossiers_caution.findMany({
        select: { transitaire_nom: true },
        where: { transitaire_nom: { not: '' } },
        distinct: ['transitaire_nom']
    });

    let transitairesAjoutes = 0;
    for (const row of dossiersTransitaires) {
        if (!row.transitaire_nom) continue;
        const nomNorm = row.transitaire_nom.trim().toUpperCase();

        if (!setPartenaires.has(nomNorm)) {
            // Création du transitaire manquant
            await prisma.partenaires.create({
                data: {
                    nom_partenaire: row.transitaire_nom,
                    est_client: 0,
                    est_transitaire: 1,
                }
            });
            setPartenaires.add(nomNorm);
            transitairesAjoutes++;
            console.log(`[+] Transitaire ajouté : ${row.transitaire_nom}`);
        }
    }

    console.log(`\n=== BILAN FINAL ===`);
    console.log(`- Nouveaux clients créés : ${clientsAjoutes}`);
    console.log(`- Nouveaux transitaires créés : ${transitairesAjoutes}`);
    console.log("Opération terminée avec succès !");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
