const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
}

async function main() {
    const username = 'test';
    const email = 'test@example.com';
    const password = 'test';

    const existing = await prisma.users.findFirst({
        where: { OR: [{ email }, { username }] }
    });

    if (existing) {
        console.log('Utilisateur "test" existe déjà. Mise à jour du mot de passe...');
        await prisma.users.update({
            where: { id: existing.id },
            data: { password_hash: hashPassword(password) }
        });
        console.log('Mot de passe mis à jour avec succès.');
        return;
    }

    const password_hash = hashPassword(password);

    await prisma.users.create({
        data: {
            username,
            email,
            password_hash,
            role: 'USER',
            permissions: '[]'
        }
    });

    console.log('Utilisateur "test" créé avec succès.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
