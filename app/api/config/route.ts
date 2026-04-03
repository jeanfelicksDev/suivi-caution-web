import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        let settings = await prisma.app_settings.findUnique({ where: { id: 1 } });
        if (!settings) {
            settings = await prisma.app_settings.create({
                data: { id: 1, scanFolderPath: "file:///C:/Chemin/Vers/Dossier/Scanne" }
            });
        }
        return NextResponse.json({ scanFolderPath: settings.scanFolderPath });
    } catch (error) {
        console.error("Erreur lecture config:", error);
        return NextResponse.json({ scanFolderPath: "file:///C:/Chemin/Vers/Dossier/Scanne" });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { scanFolderPath } = body;
        
        const settings = await prisma.app_settings.upsert({
            where: { id: 1 },
            update: { scanFolderPath },
            create: { id: 1, scanFolderPath }
        });
        
        return NextResponse.json(settings);
    } catch (error) {
        console.error("Erreur sauvegarde config:", error);
        return NextResponse.json({ error: "Erreur lors de la sauvegarde" }, { status: 500 });
    }
}
