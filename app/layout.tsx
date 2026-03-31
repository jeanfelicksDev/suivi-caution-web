import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import AuthProvider from "@/app/components/AuthProvider";
import LayoutContent from "@/app/components/LayoutContent";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Suivi_caution_Web 2.0",
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
          <LayoutContent>
            {children}
          </LayoutContent>
        </AuthProvider>
      </body>
    </html>
  );
}

