# Application de Suivi des Cautions

Cette application permet de gérer les dossiers de cautions basés sur le numéro de facture.

## Fonctionnalités
- Recherche par numéro de facture.
- Affichage automatique des données si le dossier existe (Formulaire de mise à jour).
- Ouverture d'un formulaire de saisie simplifié si le numéro est nouveau.
- Interface moderne et premium.

## Installation
1. `npm install`
2. `npx prisma generate`
3. `npm run dev`

## Base de données
Utilise `prisma/dev.db` (SQLite).

## Déploiement
L'application est déployée sur Vercel : [suivicautionweb.vercel.app](https://suivicautionweb.vercel.app)
