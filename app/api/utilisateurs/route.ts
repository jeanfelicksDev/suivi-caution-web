import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkPermission } from '@/lib/auth-server';

export async function GET(request: Request) {
    try {
        const userId = request.headers.get('x-user-id') || undefined;
        // Vérifier si l'utilisateur est ADMIN
        const callingUser = await prisma.users.findUnique({ where: { id: Number(userId) ? Number(userId) : 0 } });
        if (!callingUser || callingUser.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Accès refusé. Admin requis.' }, { status: 403 });
        }
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
        const userId = request.headers.get('x-user-id') || undefined;
        const callingUser = await prisma.users.findUnique({ where: { id: Number(userId) ? Number(userId) : 0 } });
        if (!callingUser || callingUser.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Accès refusé. Admin requis.' }, { status: 403 });
        }
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

export async function DELETE(request: Request) {
    try {
        const userId = request.headers.get('x-user-id') || undefined;
        const callingUser = await prisma.users.findUnique({ where: { id: Number(userId) ? Number(userId) : 0 } });
        if (!callingUser || callingUser.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Accès refusé. Admin requis.' }, { status: 403 });
        }
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "ID de l'utilisateur manquant" }, { status: 400 });
        }

        const deletedUser = await prisma.users.delete({
            where: { id: Number(id) }
        });

        return NextResponse.json({ success: true, user: deletedUser });
    } catch (error) {
        console.error("Erreur lors de la suppression de l'utilisateur:", error);
        return NextResponse.json({ error: "Erreur lors de la suppression (utilisateur peut-être inexistant)" }, { status: 500 });
    }
}
