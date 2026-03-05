import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { differenceInBusinessDays, parseISO, isValid } from 'date-fns';

// Jours fériés fixes en Côte d'Ivoire (format MM-DD)
const fixedHolidaysCI = [
    '01-01', // Jour de l'An
    '05-01', // Fête du Travail
    '08-07', // Fête de l'Indépendance
    '08-15', // Assomption
    '11-01', // Toussaint
    '11-15', // Journée Nationale de la Paix
    '12-25', // Noël
];

// Fonction pour parser une date depuis YYYY-MM-DD
function parseDate(dateStr: string | null | undefined): Date | null {
    if (!dateStr) return null;
    const d = parseISO(dateStr);
    return isValid(d) ? d : null;
}

// Calcule les jours ouvrables (Business Days) moins les fériés CI fixes entre deux dates
function getWorkingDays(start: Date, end: Date): number {
    if (start > end) return 0;

    // Total des jours ouvrés de base (enlève Samedi et Dimanche)
    let bDays = differenceInBusinessDays(end, start);
    if (bDays < 0) bDays = 0;

    // Retirer les jours fériés qui tombent sur un jour de la semaine pendant cette période
    let holidaysCount = 0;
    const current = new Date(start);
    while (current <= end) {
        const dayOfWeek = current.getDay();
        // Si c'est un Lundi (1) à Vendredi (5)
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
            const mm = String(current.getMonth() + 1).padStart(2, '0');
            const dd = String(current.getDate()).padStart(2, '0');
            const md = `${mm}-${dd}`;
            if (fixedHolidaysCI.includes(md)) {
                holidaysCount++;
            }
        }
        current.setDate(current.getDate() + 1);
    }

    return Math.max(0, bDays - holidaysCount);
}

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const armateur = searchParams.get('armateur');

        const dateFilter: Record<string, string> = {};
        if (startDate || endDate) {
            if (startDate) dateFilter.gte = startDate;
            if (endDate) dateFilter.lte = endDate;
        } else {
            // Par défaut : Mois en cours
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();

            dateFilter.gte = `${year}-${month}-01`;
            dateFilter.lte = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
        }

        const dossiers = await prisma.dossiers_caution.findMany({
            where: {
                date_reception: dateFilter,
                ...(armateur && { armateur: armateur }),
            }
        });

        let totalDaysGlobal = 0;
        let countGlobal = 0;

        let totalDaysAgent = 0;
        let countAgent = 0;

        // Variables pour les étapes
        const stepTotals = Array(9).fill(0);
        const stepCounts = Array(9).fill(0);

        dossiers.forEach(dossier => {
            const dRecept = parseDate(dossier.date_reception);
            const dCheque = parseDate(dossier.date_cheque);
            const dCompta = parseDate(dossier.date_transmission_compta);

            // 1. Calcul global => DateReception à DateCheque (ou Date du jour si non renseigné)
            const dChequeEffectif = dCheque || new Date();
            if (dRecept && dChequeEffectif >= dRecept) {
                const msDiff = dChequeEffectif.getTime() - dRecept.getTime();
                const days = msDiff / (1000 * 3600 * 24);
                totalDaysGlobal += days;
                countGlobal++;
            }

            // 2. Calcul Agent => DateReception à DateCompta sans exceptions, ni WE/Fériés
            const dComptaEffectif = dCompta || new Date();
            if (dRecept && dComptaEffectif >= dRecept) {
                let agentDays = getWorkingDays(dRecept, dComptaEffectif);

                // Soustraction du temps Armateur
                const dLigne = parseDate(dossier.date_transmission_ligne);
                const dLigneRet = parseDate(dossier.date_retour_ligne);
                if (dLigne && dLigneRet && dLigneRet >= dLigne) {
                    agentDays -= getWorkingDays(dLigne, dLigneRet);
                }

                // Soustraction temps Litige
                const dLitige = parseDate(dossier.date_mise_litige);
                const dLitigeFin = parseDate(dossier.date_fin_litige);
                if (dLitige && dLitigeFin && dLitigeFin >= dLitige) {
                    agentDays -= getWorkingDays(dLitige, dLitigeFin);
                }

                // Soustraction temps Suspendu
                const dSusp = parseDate(dossier.date_suspendu);
                const dSuspFin = parseDate(dossier.date_fin_suspension) || new Date();
                if (dSusp && dSuspFin >= dSusp) {
                    agentDays -= getWorkingDays(dSusp, dSuspFin);
                }

                if (agentDays < 0) agentDays = 0; // Sécurité si dates chevauchées bizarrement
                totalDaysAgent += agentDays;
                countAgent++;
            }

            // 3. Étapes du dossier
            // Étape 1: Reçu (DateReception -> DateLigne)
            const dLigne = parseDate(dossier.date_transmission_ligne);
            if (dRecept && dLigne && dLigne >= dRecept) {
                stepTotals[0] += getWorkingDays(dRecept, dLigne);
                stepCounts[0]++;
            }

            // Étape 2: Chez Armateur (DateLigne -> DateRetourLigne)
            const dLigneRet = parseDate(dossier.date_retour_ligne);
            if (dLigne && dLigneRet && dLigneRet >= dLigne) {
                stepTotals[1] += getWorkingDays(dLigne, dLigneRet);
                stepCounts[1]++;
            }

            // Étape 3: Litige (DateLitige -> DateFinLitige)
            const dLitige = parseDate(dossier.date_mise_litige);
            const dLitigeFin = parseDate(dossier.date_fin_litige);
            if (dLitige && dLitigeFin && dLitigeFin >= dLitige) {
                stepTotals[2] += getWorkingDays(dLitige, dLitigeFin);
                stepCounts[2]++;
            }

            // Étape 4: Suspendu (DateSuspendu -> DateFinSuspendu)
            const dSusp = parseDate(dossier.date_suspendu);
            const dSuspFin = parseDate(dossier.date_fin_suspension);
            if (dSusp && dSuspFin && dSuspFin >= dSusp) {
                stepTotals[3] += getWorkingDays(dSusp, dSuspFin);
                stepCounts[3]++;
            }

            // Étape 5: Avoir (DateMiseAvoir -> DateFinAvoir)
            const dAv = parseDate(dossier.date_mise_avoir);
            const dAvFin = parseDate(dossier.date_fin_avoir);
            if (dAv && dAvFin && dAvFin >= dAv) {
                stepTotals[4] += getWorkingDays(dAv, dAvFin);
                stepCounts[4]++;
            }

            // Étape 6: Signature 1 (Retour Ligne/Litige -> Sig1)
            const dSig1 = parseDate(dossier.date_1er_signature);
            // On approxime à partir de la date de retour ligne
            if (dLigneRet && dSig1 && dSig1 >= dLigneRet) {
                stepTotals[5] += getWorkingDays(dLigneRet, dSig1);
                stepCounts[5]++;
            }

            // Étape 7: Signature 2 (Sig1 -> Sig2)
            const dSig2 = parseDate(dossier.date_2e_signature);
            if (dSig1 && dSig2 && dSig2 >= dSig1) {
                stepTotals[6] += getWorkingDays(dSig1, dSig2);
                stepCounts[6]++;
            }

            // Étape 8: A la Compta (Sig2 -> TransmisCompta)
            if (dSig2 && dCompta && dCompta >= dSig2) {
                stepTotals[7] += getWorkingDays(dSig2, dCompta);
                stepCounts[7]++;
            }

            // Étape 9: Edition Chèque (TransmisCompta -> DateCheque)
            if (dCompta && dCheque && dCheque >= dCompta) {
                stepTotals[8] += getWorkingDays(dCompta, dCheque);
                stepCounts[8]++;
            }

        });

        // Formatage des résultats
        const avgGlobal = countGlobal > 0 ? Math.round(totalDaysGlobal / countGlobal) : 0;
        const avgAgent = countAgent > 0 ? Math.round(totalDaysAgent / countAgent) : 0;

        const stepAverages = stepTotals.map((tot, i) => {
            return stepCounts[i] > 0 ? Math.round(tot / stepCounts[i]) : 0;
        });

        // Calculs pour les 4 cartes (StatCards) du haut
        const totalDossiers = dossiers.length;
        const actifs = dossiers.filter(d => !d.date_cloture).length;

        const clientsUniques = new Set();
        let dosCaches = 0;
        dossiers.forEach(d => {
            if (d.client_nom) clientsUniques.add(d.client_nom);
            if (d.date_cheque) dosCaches++;
        });
        const tauxRetour = totalDossiers > 0 ? Math.round((dosCaches / totalDossiers) * 100) : 0;

        return NextResponse.json({
            avgGlobal,
            avgAgent,
            stepAverages,
            statsCards: {
                totalDossiers,
                actifs,
                clientsUniques: clientsUniques.size,
                tauxRetour
            }
        });

    } catch (error) {
        console.error('Erreur API Dashboard:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
