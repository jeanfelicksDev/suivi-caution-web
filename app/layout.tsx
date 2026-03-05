import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "@/app/components/Sidebar";
import FieldHighlighter from "@/app/components/FieldHighlighter";
import AuthProvider from "@/app/components/AuthProvider";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Suivi des Cautions - Gestion Portuaire",
  description: "Application de suivi et de gestion des cautions",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className={inter.className}>
        <AuthProvider>
          <div className="layout-wrapper">
            <Sidebar />
            <main className="main-content">
              {children}
              <FieldHighlighter />
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}

