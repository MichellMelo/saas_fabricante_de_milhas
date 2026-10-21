import type { Metadata } from "next";
// @ts-expect-error Next.js handles global CSS imports at runtime.
import "./globals.css";

export const metadata: Metadata = {
  title: "Fabricante de Milhas | Visão geral",
  description:
    "Painel executivo para organizar pontos, milhas e decisões de viagem.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
