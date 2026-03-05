import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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
    const body = await request.json();
    const updated = await prisma.partenaires.update({
        where: { id_partenaire: parseInt(id) },
        data: body
    });
    return NextResponse.json(updated);
}
