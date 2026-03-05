import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Sidebar from "@/app/components/Sidebar";
import FieldHighlighter from "@/app/components/FieldHighlighter";
import AuthProvider from "@/app/components/AuthProvider";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
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
      <body className={outfit.className}>
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

