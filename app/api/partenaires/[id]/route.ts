import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkPermission } from '@/lib/auth-server';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const part = await prisma.partenaires.findUnique({
        where: { id_partenaire: parseInt(id) }
    });
    return NextResponse.json(part);
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const userId = request.headers.get('x-user-id') || undefined;
        const canWrite = await checkPermission(userId, 'PARTENAIRE_WRITE') || await checkPermission(userId, 'DOSSIER_WRITE');
        if (!canWrite) {
            return NextResponse.json({ error: 'Permission refusée' }, { status: 403 });
        }
        const body = await request.json();
        const updated = await prisma.partenaires.update({
            where: { id_partenaire: parseInt(id) },
            data: body
        });
        return NextResponse.json(updated);
    } catch (error: unknown) {
        console.error(error);
        return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    try {
        const userId = request.headers.get('x-user-id') || undefined;
        if (!await checkPermission(userId, 'PARTENAIRE_WRITE')) {
            return NextResponse.json({ error: 'Permission refusée (PARTENAIRE_WRITE requis)' }, { status: 403 });
        }
        await prisma.partenaires.delete({
            where: { id_partenaire: parseInt(id) }
        });
        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
