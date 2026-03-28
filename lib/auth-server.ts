import { prisma } from './prisma';

export async function checkPermission(userId: string | number | undefined, requiredPerm: string) {
    if (!userId) return false;

    const user = await prisma.users.findUnique({
        where: { id: Number(userId) }
    });

    if (!user) return false;
    if (user.role === 'ADMIN') return true;

    try {
        const perms = JSON.parse(user.permissions || '[]');
        return perms.includes(requiredPerm);
    } catch {
        return false;
    }
}
