import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.partenaires.count().then((c) => console.log('Exact count:', c)).finally(() => prisma.$disconnect());
