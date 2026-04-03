import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        let settings = await prisma.app_settings.findUnique({ where: { id: 1 } });
        if (!settings) {
            settings = await prisma.app_settings.create({
                data: { id: 1, scanFolderPath: "file:///C:/Chemin/Vers/Dossier/Scanne", logoutDelay: 60 }
            });
        }
        return NextResponse.json({ 
            scanFolderPath: settings.scanFolderPath,
            logoutDelay: settings.logoutDelay || 60
        });
    } catch (error) {
        console.error("Erreur lecture config:", error);
        return NextResponse.json({ 
            scanFolderPath: "file:///C:/Chemin/Vers/Dossier/Scanne",
            logoutDelay: 60
        });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { scanFolderPath, logoutDelay } = body;
        
        const settings = await prisma.app_settings.upsert({
            where: { id: 1 },
            update: { 
                ...(scanFolderPath !== undefined && { scanFolderPath }),
                ...(logoutDelay !== undefined && { logoutDelay: parseInt(logoutDelay) })
            },
            create: { 
                id: 1, 
                scanFolderPath: scanFolderPath || "file:///C:/Chemin/Vers/Dossier/Scanne",
                logoutDelay: logoutDelay ? parseInt(logoutDelay) : 60
            }
        });
        
        return NextResponse.json(settings);
    } catch (error) {
        console.error("Erreur sauvegarde config:", error);
        return NextResponse.json({ error: "Erreur lors de la sauvegarde" }, { status: 500 });
    }
}
