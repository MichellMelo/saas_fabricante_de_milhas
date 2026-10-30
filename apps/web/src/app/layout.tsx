import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";
import { PwaRegister } from "@/components/pwa-register";

const siteUrl = "https://fabricantedemilhas.vercel.app";
const shareTitle = "Fabricante de Milhas | Estratégias, oportunidades e viagens";
const shareDescription =
  "Organize pontos e milhas, acompanhe oportunidades e tome decisões melhores para viajar.";
const brandImage = "/logo.jpeg?v=3";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Fabricante de Milhas | Visão geral",
  description:
    "Painel executivo para organizar pontos, milhas e decisões de viagem.",
  applicationName: "Fabricante de Milhas",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Fabricante de Milhas",
  },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: siteUrl,
    siteName: "Fabricante de Milhas",
    title: shareTitle,
    description: shareDescription,
    images: [
      {
        url: brandImage,
        type: "image/jpeg",
        alt: "Logomarca Fabricante de Milhas",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: shareTitle,
    description: shareDescription,
    images: [brandImage],
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
      { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
    ],
    shortcut: "/favicon-32x32.png",
    apple: [{ url: "/logo.jpeg", type: "image/jpeg" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.variable} ${inter.className}`}>
        <PwaRegister />
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
