import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkPermission } from '@/lib/auth-server';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'client' or 'transitaire'
    const query = searchParams.get('query')?.trim() || '';

    try {
        const parts = await prisma.partenaires.findMany({
            where: {
                nom_partenaire: { contains: query },
                ...(type === 'client' ? { est_client: 1 } : {}),
                ...(type === 'transitaire' ? { est_transitaire: 1 } : {}),
            },
            orderBy: { nom_partenaire: 'asc' },
        });
        return NextResponse.json(parts);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const userId = request.headers.get('x-user-id') || undefined;
        const canWrite = await checkPermission(userId, 'PARTENAIRE_WRITE') || await checkPermission(userId, 'DOSSIER_WRITE');
        if (!canWrite) {
            return NextResponse.json({ error: 'Permission refusée' }, { status: 403 });
        }
        const body = await request.json();
        const part = await prisma.partenaires.create({
            data: {
                nom_partenaire: body.nom_partenaire,
                est_client: body.est_client ? 1 : 0,
                est_transitaire: body.est_transitaire ? 1 : 0,
                num_fne: body.num_fne || null,
                telephone: body.telephone || null,
                email: body.email || null,
            }
        });
        return NextResponse.json(part);
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: 'FNE déjà utilisé ou erreur serveur' }, { status: 400 });
    }
}
