import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const siteUrl = "https://fabricantedemilhas.vercel.app";
const shareTitle = "Fabricante de Milhas | Estratégias, oportunidades e viagens";
const shareDescription =
  "Organize pontos e milhas, acompanhe oportunidades e tome decisões melhores para viajar.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Fabricante de Milhas | Visão geral",
  description:
    "Painel executivo para organizar pontos, milhas e decisões de viagem.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "Fabricante de Milhas",
    title: shareTitle,
    description: shareDescription,
    images: [
      {
        url: "/og-image.png",
        width: 1734,
        height: 907,
        alt: "Fabricante de Milhas — Estratégias, oportunidades e viagens",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: shareTitle,
    description: shareDescription,
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    shortcut: "/favicon-32x32.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${inter.className}`}><ToastProvider>{children}</ToastProvider></body>
    </html>
  );
}
