import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { differenceInBusinessDays, parseISO, isValid } from 'date-fns';

export const dynamic = 'force-dynamic';

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

// Calcule les jours ouvrables entre start et end, EN EXCLUANT la période de suspension (si elle chevauche)
function getNetWorkingDays(start: Date, end: Date, suspStart: Date | null, suspEnd: Date | null): number {
    let total = getWorkingDays(start, end);
    if (!suspStart || !suspEnd || suspEnd < suspStart) return total;

    // Intersection entre [start, end] et [suspStart, suspEnd]
    const intersectStart = new Date(Math.max(start.getTime(), suspStart.getTime()));
    const intersectEnd = new Date(Math.min(end.getTime(), suspEnd.getTime()));

    if (intersectStart <= intersectEnd) {
        const overlap = getWorkingDays(intersectStart, intersectEnd);
        total = Math.max(0, total - overlap);
    }
    return total;
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
            if (endDate) {
                // Pour inclure toute la journée de fin
                const lastDay = new Date(endDate);
                const year = lastDay.getFullYear();
                const month = String(lastDay.getMonth() + 1).padStart(2, '0');
                const lastDayNum = lastDay.getDate();
                dateFilter.lte = `${year}-${month}-${String(lastDayNum).padStart(2, '0')}`;
            }
        } else {
            // Par défaut : Mois en cours
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();

            dateFilter.gte = `${year}-${month}-01`;
            dateFilter.lte = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
        }

        const dossiers = await (prisma.dossiers_caution.findMany({
            where: {
                date_reception: dateFilter,
                ...(armateur && { armateur: armateur }),
            },
            select: {
                id: true,
                armateur: true,
                date_reception: true,
                date_transmission_ligne: true,
                date_retour_ligne: true,
                date_mise_litige: true,
                date_fin_litige: true,
                date_trans_sce_detention: true,
                date_mise_avoir: true,
                date_fin_avoir: true,
                date_trans_rec: true,
                date_ret_rec: true,
                date_suspendu: true,
                date_fin_suspension: true,
                date_1er_signature: true,
                date_retour_1er_signature: true,
                date_2e_signature: true,
                date_retour_2e_signature: true,
                date_piece_caisse: true,
                date_transmission_compta: true,
                date_cheque: true,
                date_cloture: true,
                client_nom: true,
                date_retour_compta: true,
            } as any
        }) as any);

        let totalDaysGlobal = 0;
        let countGlobal = 0;

        let totalDaysAgent = 0;
        let countAgent = 0;

        // Variables pour les étapes (10 étapes désormais)
        const stepTotals = Array(10).fill(0);
        const stepCounts = Array(10).fill(0);

        dossiers.forEach((dossier: any) => {
            const dRecept = parseDate(dossier.date_reception);
            const dCheque = parseDate(dossier.date_cheque);
            const dCompta = parseDate(dossier.date_transmission_compta);
            const dRetourCompta = parseDate(dossier.date_retour_compta);

            const dSusp = parseDate(dossier.date_suspendu);
            const dSuspFin = parseDate(dossier.date_fin_suspension);

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
                let agentDays = getNetWorkingDays(dRecept, dComptaEffectif, dSusp, dSuspFin);

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

                if (agentDays < 0) agentDays = 0; 
                totalDaysAgent += agentDays;
                countAgent++;
            }

            // 3. Étapes du dossier (10 Étapes demandées)
            
            // 1. Temps traitement réception (Réception -> Trans. Ligne)
            const dLigne = parseDate(dossier.date_transmission_ligne);
            if (dRecept && dLigne && dLigne >= dRecept) {
                stepTotals[0] += getNetWorkingDays(dRecept, dLigne, dSusp, dSuspFin);
                stepCounts[0]++;
            }

            // 2. Temps chez armateur (Trans. Ligne -> Retour Ligne)
            const dLigneRet = parseDate(dossier.date_retour_ligne);
            if (dLigne && dLigneRet && dLigneRet >= dLigne) {
                stepTotals[1] += getNetWorkingDays(dLigne, dLigneRet, dSusp, dSuspFin);
                stepCounts[1]++;
            }

            // 3. Temps au Sce détention (Trans. Détention -> 1ère Signature)
            const dDet = parseDate(dossier.date_trans_sce_detention);
            const dSig1 = parseDate(dossier.date_1er_signature);
            if (dDet && dSig1 && dSig1 >= dDet) {
                stepTotals[2] += getNetWorkingDays(dDet, dSig1, dSusp, dSuspFin);
                stepCounts[2]++;
            }

            // 4. Temps mis en litige (Mise Litige -> Fin Litige)
            const dLitige = parseDate(dossier.date_mise_litige);
            const dLitigeFin = parseDate(dossier.date_fin_litige);
            if (dLitige && dLitigeFin && dLitigeFin >= dLitige) {
                stepTotals[3] += getNetWorkingDays(dLitige, dLitigeFin, dSusp, dSuspFin);
                stepCounts[3]++;
            }
            
            // 5. Temps traitement avoirs (Mise Avoir -> Fin Avoir)
            const dAv = parseDate(dossier.date_mise_avoir);
            const dAvFin = parseDate(dossier.date_fin_avoir);
            if (dAv && dAvFin && dAvFin >= dAv) {
                stepTotals[4] += getNetWorkingDays(dAv, dAvFin, dSusp, dSuspFin);
                stepCounts[4]++;
            }

            // 6. Temps mis au recouvrement (Trans. Recouv. -> Ret. Recouv.)
            const dRec = parseDate(dossier.date_trans_rec);
            const dRecFin = parseDate(dossier.date_ret_rec);
            if (dRec && dRecFin && dRecFin >= dRec) {
                stepTotals[5] += getNetWorkingDays(dRec, dRecFin, dSusp, dSuspFin);
                stepCounts[5]++;
            }

            // 7. Temps passé 1ère signature (1ère Sig. -> Ret. 1ère Sig.)
            const dSig1Ret = parseDate(dossier.date_retour_1er_signature);
            if (dSig1 && dSig1Ret && dSig1Ret >= dSig1) {
                stepTotals[6] += getNetWorkingDays(dSig1, dSig1Ret, dSusp, dSuspFin);
                stepCounts[6]++;
            }

            // 8. Temps passé 2ème signature (2ème Sig. -> Ret. 2ème Sig.)
            const dSig2 = parseDate(dossier.date_2e_signature);
            const dSig2Ret = parseDate(dossier.date_retour_2e_signature);
            if (dSig2 && dSig2Ret && dSig2Ret >= dSig2) {
                stepTotals[7] += getNetWorkingDays(dSig2, dSig2Ret, dSusp, dSuspFin);
                stepCounts[7]++;
            }

            // 9. Temps établir pièce de caisse (Ret. 2ème Sig. -> Pièce Caisse)
            const dCaisse = parseDate(dossier.date_piece_caisse);
            if (dSig2Ret && dCaisse && dCaisse >= dSig2Ret) {
                stepTotals[8] += getNetWorkingDays(dSig2Ret, dCaisse, dSusp, dSuspFin);
                stepCounts[8]++;
            }

            // 10. Temps passé comptabilité (Trans. Compta -> Retour Compta)
            if (dCompta && dRetourCompta && dRetourCompta >= dCompta) {
                stepTotals[9] += getNetWorkingDays(dCompta, dRetourCompta, dSusp, dSuspFin);
                stepCounts[9]++;
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
        const actifs = dossiers.length;

        const clientsUniques = new Set();
        let dosCaches = 0;
        dossiers.forEach((d: any) => {
            if (d.client_nom) clientsUniques.add(d.client_nom);
            // Dossier est considéré "traité" (pour le taux de retour) s'il a atteint l'un des stades de paiement/clôture
            if (d.date_cheque || d.date_cloture) dosCaches++;
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
