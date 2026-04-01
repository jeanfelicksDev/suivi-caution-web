import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma et pdfjs-dist doivent être traités comme modules externes côté serveur
  serverExternalPackages: ['@prisma/client', 'prisma', 'pdf-parse', 'pdfjs-dist', '@napi-rs/canvas'],
  outputFileTracingIncludes: {
    '/api/cheques/parse-pdf': [
      './node_modules/pdfjs-dist/legacy/build/pdf.mjs',
      './node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
    ],
    '/api/**/*': [
      './node_modules/@napi-rs/canvas/**/*'
    ],
  },
};

export default nextConfig;
