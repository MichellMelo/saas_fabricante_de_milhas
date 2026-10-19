import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
 title: "Fabricante de Milhas | Visão geral",
 description: "Painel executivo para organizar pontos, milhas e decisões de viagem."
};

export default function RootLayout({children}:{children:React.ReactNode}) {
 return <html lang="pt-BR"><body>{children}</body></html>;
}
