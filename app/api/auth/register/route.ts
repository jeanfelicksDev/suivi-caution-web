import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/app/lib/auth';

export async function POST(request: Request) {
    try {
        const { username, email, password } = await request.json();

        if (!username || !email || !password) {
            return NextResponse.json({ error: 'Tous les champs sont requis.' }, { status: 400 });
        }

        const existing = await prisma.users.findFirst({
            where: { OR: [{ email }, { username }] }
        });

        if (existing) {
            return NextResponse.json({ error: 'Email ou nom d\'utilisateur déjà utilisé.' }, { status: 400 });
        }

        // Si aucun utilisateur n'existe en base, c'est le 1er ! On le met ADMIN par défaut
        const totalUsers = await prisma.users.count();
        const defaultRole = totalUsers === 0 ? 'ADMIN' : 'USER';
        // par défaut, le USER n'a que accès à "Recherche & Suivi" et aucunes permission spéciales d'après la demande (la config Sidebar gère la vue).

        const password_hash = hashPassword(password);

        const newUser = await prisma.users.create({
            data: {
                username,
                email,
                password_hash,
                role: defaultRole,
                permissions: '[]'
            }
        });

        return NextResponse.json({ success: true, message: 'Compte créé avec succès !' });
    } catch (error) {
        console.error('Erreur inscription:', error);
        return NextResponse.json({ error: 'Erreur lors de la création du compte.' }, { status: 500 });
    }
}
