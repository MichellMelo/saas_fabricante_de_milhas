"use client";

import { CircleHelp, ChevronRight, LayoutDashboard, CreditCard, Calculator, Plane, Clock3, Settings2, Users, MessageCircle, Video, GraduationCap, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarSeparator } from "@/components/ui/sidebar";

export type DashboardRoute = "dashboard" | "programas" | "calculadoras" | "passagens" | "historico" | "programas-admin" | "clientes-admin" | "grupo-vip" | "auloes" | "mentorias" | "financeiro";
export type SidebarNavItem = { key: DashboardRoute; label: string; icon: LucideIcon; soon?: boolean };

const iconByRoute: Partial<Record<DashboardRoute, LucideIcon>> = {
  dashboard: LayoutDashboard, programas: CreditCard, "programas-admin": Settings2,
  "clientes-admin": Users, financeiro: Wallet, "grupo-vip": MessageCircle,
  auloes: Video, mentorias: GraduationCap, calculadoras: Calculator, passagens: Plane, historico: Clock3,
};

export function DashboardSidebar({ mobileOpen, route, navItems, navigate, notify }: {
  mobileOpen: boolean;
  route: DashboardRoute;
  navItems: SidebarNavItem[];
  navigate: (route: DashboardRoute) => void;
  notify: (message: string) => void;
}) {
  return (
    <Sidebar data-mobile-open={mobileOpen}>
      <SidebarHeader className="px-5 pb-5 pt-6">
        <button className="group flex min-h-[88px] items-center justify-center rounded-xl px-3 transition-colors hover:bg-white/[.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6a45c]/70" onClick={() => navigate("dashboard")} aria-label="Fabricante de Milhas, início">
          <img src="/logo-sem-background.png" alt="Fabricante de Milhas" width="176" height="118" className="h-[116px] w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]" />
        </button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Espaço de trabalho</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map(({ key, label, icon: FallbackIcon, soon }) => {
              const Icon = iconByRoute[key] ?? FallbackIcon;
              return (
                <SidebarMenuItem key={key}>
                  <SidebarMenuButton isActive={route === key} onClick={() => navigate(key)} title={label}>
                    <Icon size={18} strokeWidth={1.8} className="shrink-0" />
                    <span className="min-w-0 flex-1 truncate">{label}</span>
                    {soon && <span className="ml-auto rounded-md border border-white/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-slate-500">EM BREVE</span>}
                    {!soon && route === key && <ChevronRight size={14} className="ml-auto shrink-0 text-[#c6a45c]" />}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="rounded-xl border border-white/10 bg-white/[.035] p-3.5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-100"><CircleHelp size={17} className="text-[#c6a45c]" /> Precisa de ajuda?</div>
          <p className="mt-1.5 text-xs leading-5 text-slate-400">Dicas para aproveitar melhor seus pontos e milhas.</p>
          <button className="mt-2 text-xs font-semibold text-[#d8b66a] transition-colors hover:text-[#f0d38e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6a45c]" onClick={() => notify("Dica: compare custo por milheiro, taxas e valor real do resgate antes de decidir.")}>Ver guia rápido <span aria-hidden="true">↗</span></button>
        </div>
        <SidebarSeparator />
        <div className="flex items-center gap-2 px-1 py-1 text-[11px] text-slate-500">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,.10)]" />
          <span>Ambiente de demonstração</span>
          <span className="ml-auto text-slate-600">v0.3</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
