"use client";

import { CircleHelp, ChevronRight, LayoutDashboard, CreditCard, Calculator, Plane, Clock3, Settings2, Users, MessageCircle, Video, GraduationCap, Wallet, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarSeparator } from "@/components/ui/sidebar";

export type DashboardRoute = "dashboard" | "oportunidades" | "aprender" | "programas" | "calculadoras" | "passagens" | "historico" | "programas-admin" | "clientes-admin" | "grupo-vip" | "auloes" | "mentorias" | "financeiro" | "mile-finance";
export type SidebarNavItem = { key: DashboardRoute; label: string; icon: LucideIcon; soon?: boolean };

const iconByRoute: Partial<Record<DashboardRoute, LucideIcon>> = {
  dashboard: LayoutDashboard, oportunidades: Sparkles, aprender: GraduationCap, programas: CreditCard, "programas-admin": Settings2,
  "clientes-admin": Users, financeiro: Wallet, calculadoras: Calculator, passagens: Plane, historico: Clock3,
};

export function DashboardSidebar({ mobileOpen, route, navItems, navigate, notify }: {
  mobileOpen: boolean;
  route: DashboardRoute;
  navItems: SidebarNavItem[];
  navigate: (route: DashboardRoute) => void;
  notify: (message: string) => void;
}) {
  return (
    <Sidebar mobileOpen={mobileOpen}>
      <SidebarHeader className="shrink-0 px-5 pb-2 pt-3">
        <button className="group flex min-h-[60px] items-center justify-center rounded-xl px-3 transition-colors hover:bg-white/[.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6a45c]/70" onClick={() => navigate("dashboard")} aria-label="Fabricante de Milhas, início">
          <img src="/logo-sem-background.png" alt="Fabricante de Milhas" width="150" height="82" className="h-[72px] w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]" />
        </button>
      </SidebarHeader>
      <SidebarContent className="flex-none gap-3 overflow-visible px-3 py-1">
        <SidebarGroup className="gap-1.5">
          <SidebarGroupLabel>Espaço de trabalho</SidebarGroupLabel>
          <SidebarMenu className="gap-1">
            {navItems.map(({ key, label, icon: FallbackIcon, soon }) => {
              const Icon = iconByRoute[key] ?? FallbackIcon;
              return (
                <SidebarMenuItem key={key}>
                  <SidebarMenuButton isActive={route === key} onClick={() => navigate(key)} title={label}>
                    <Icon size={18} strokeWidth={1.8} className="shrink-0" />
                    <span className="min-w-0 flex-1 whitespace-normal break-words text-left leading-tight">{label}</span>
                    {soon && <span className="ml-auto shrink-0 rounded-md border border-white/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-slate-500">EM BREVE</span>}
                    {!soon && route === key && <ChevronRight size={14} className="ml-auto shrink-0 text-[#c6a45c]" />}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="mt-auto shrink-0 gap-2 p-3">
        <div className="rounded-xl border border-white/10 bg-white/[.035] p-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100"><CircleHelp size={17} className="text-[#c6a45c]" /> Precisa de ajuda?</div>
          <p className="mt-1 text-[11px] leading-4 text-slate-400">Dicas para aproveitar melhor seus pontos e milhas.</p>
          <button className="mt-1.5 text-xs font-semibold text-[#d8b66a] transition-colors hover:text-[#f0d38e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6a45c]" onClick={() => notify("Dica: compare custo por milheiro, taxas e valor real do resgate antes de decidir.")}>Ver guia rápido <span aria-hidden="true">↗</span></button>
        </div>
        <SidebarSeparator />
      </SidebarFooter>
    </Sidebar>
  );
}
