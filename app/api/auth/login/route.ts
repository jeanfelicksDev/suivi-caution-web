import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/app/lib/auth';

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Tous les champs sont requis.' }, { status: 400 });
        }

        const user = await prisma.users.findFirst({
            where: { email }
        });

        if (!user || !verifyPassword(password, user.password_hash)) {
            return NextResponse.json({ error: 'Identifiants incorrects.' }, { status: 401 });
        }

        // On parse les permissions
        let perms = [];
        try {
            perms = JSON.parse(user.permissions || '[]');
        } catch { }

        // Créer l'objet utilisateur de session
        const sessionUser = {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            permissions: perms,
        };

        return NextResponse.json({ success: true, user: sessionUser });
    } catch (error) {
        console.error('Erreur connexion:', error);
        return NextResponse.json({ error: 'Erreur serveur.' }, { status: 500 });
    }
}
