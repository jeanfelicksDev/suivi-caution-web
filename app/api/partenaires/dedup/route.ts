import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const all = await prisma.partenaires.findMany({
            orderBy: { id_partenaire: 'asc' }
        });

        // Grouper par nom normalisé (trim + lowercase)
        const groups: Record<string, typeof all> = {};
        for (const p of all) {
            const key = p.nom_partenaire.trim().toLowerCase();
            if (!groups[key]) groups[key] = [];
            groups[key].push(p);
        }

        const toDelete: number[] = [];
        const toUpdate: { id: number; data: object }[] = [];

        for (const group of Object.values(groups)) {
            if (group.length < 2) continue;

            // Stratégie de sélection du meilleur enregistrement :
            // 1. Priorité à celui qui a un FNE
            // 2. Ensuite celui qui est Client
            // 3. Sinon le plus ancien (id le plus petit)
            const scored = group.map(p => ({
                ...p,
                score: (p.num_fne ? 100 : 0) + (p.est_client === 1 ? 10 : 0) + (p.est_transitaire === 1 ? 1 : 0)
            }));
            scored.sort((a, b) => b.score - a.score || a.id_partenaire - b.id_partenaire);

            const keeper = scored[0];
            const duplicates = scored.slice(1);

            // Si le keeper n'est pas encore client mais un doublon l'est, fusionner
            const anyHasFne = scored.find(p => p.num_fne);
            if (anyHasFne && !keeper.num_fne) {
                toUpdate.push({ id: keeper.id_partenaire, data: { num_fne: anyHasFne.num_fne } });
            }

            for (const dup of duplicates) {
                toDelete.push(dup.id_partenaire);
            }
        }

        // Appliquer les mises à jour FNE
        for (const upd of toUpdate) {
            await prisma.partenaires.update({
                where: { id_partenaire: upd.id },
                data: upd.data
            });
        }

        // Supprimer les doublons
        if (toDelete.length > 0) {
            await prisma.partenaires.deleteMany({
                where: { id_partenaire: { in: toDelete } }
            });
        }

        const remaining = await prisma.partenaires.count();
        return NextResponse.json({
            success: true,
            deleted: toDelete.length,
            updated: toUpdate.length,
            remaining
        });

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
