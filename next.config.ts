import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma doit être traité comme module externe côté serveur
  serverExternalPackages: ['@prisma/client', 'prisma'],
};

export default nextConfig;
