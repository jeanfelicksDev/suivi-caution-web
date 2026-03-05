import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // Assumant que le fichier existe, au pire sinon on initialise

export async function GET() {
    try {
        const users = await prisma.users.findMany({
            orderBy: { created_at: 'desc' },
            select: { id: true, username: true, email: true, role: true, permissions: true, created_at: true }
        });

        // Parse les permissions (qui sont en string JSON) en array
        const mappedUsers = users.map(user => {
            let parsedPerms = [];
            try {
                parsedPerms = JSON.parse(user.permissions || '[]');
            } catch {
                parsedPerms = [];
            }
            return {
                ...user,
                permissions: Array.isArray(parsedPerms) ? parsedPerms : []
            };
        });

        return NextResponse.json(mappedUsers);
    } catch (error) {
        console.error("Erreur lors de la récupération des utilisateurs:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, permissions, role } = body;

        if (!id) {
            return NextResponse.json({ error: "ID de l'utilisateur manquant" }, { status: 400 });
        }

        const serializedPermissions = JSON.stringify(permissions || []);

        const updatedUser = await prisma.users.update({
            where: { id: Number(id) },
            data: {
                role: role,
                permissions: serializedPermissions
            }
        });

        return NextResponse.json({ success: true, user: updatedUser });
    } catch (error) {
        console.error("Erreur de mise à jour des droits:", error);
        return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }
}
