import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma et pdf-parse doivent être traités comme modules externes côté serveur
  serverExternalPackages: ['@prisma/client', 'prisma', 'pdf-parse'],
};

export default nextConfig;
