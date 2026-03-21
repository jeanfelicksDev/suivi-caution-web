import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: idStr } = await params;
        const id = parseInt(idStr);
        if (isNaN(id)) {
            return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });
        }

        await prisma.dossiers_caution.delete({
            where: { id }
        });

        return NextResponse.json({ message: 'Dossier deleted successfully' });
    } catch (error) {
        console.error('Error deleting dossier:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
