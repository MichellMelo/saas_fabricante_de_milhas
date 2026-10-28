"use client";

import {
  ChevronRight,
  LayoutDashboard,
  CreditCard,
  Calculator,
  Plane,
  Clock3,
  Settings2,
  Users,
  MessageCircle,
  Video,
  GraduationCap,
  Wallet,
  Sparkles,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export type DashboardRoute =
  | "dashboard"
  | "programas"
  | "calculadoras"
  | "passagens"
  | "historico"
  | "programas-admin"
  | "clientes-admin"
  | "grupo-vip"
  | "auloes"
  | "mentorias"
  | "financeiro"
  | "mile-finance";
export type SidebarNavItem = {
  key: DashboardRoute;
  label: string;
  icon: LucideIcon;
  soon?: boolean;
};

const iconByRoute: Partial<Record<DashboardRoute, LucideIcon>> = {
  dashboard: LayoutDashboard,
  programas: CreditCard,
  "programas-admin": Settings2,
  "clientes-admin": Users,
  financeiro: Wallet,
  calculadoras: Calculator,
  passagens: Plane,
  historico: Clock3,
};

export function DashboardSidebar({
  mobileOpen,
  collapsed,
  route,
  navItems,
  navigate,
  notify,
}: {
  mobileOpen: boolean;
  collapsed: boolean;
  route: DashboardRoute;
  navItems: SidebarNavItem[];
  navigate: (route: DashboardRoute) => void;
  notify: (message: string) => void;
}) {
  return (
    <Sidebar
      mobileOpen={mobileOpen}
      className={collapsed ? "sidebar-collapsed" : ""}
    >
      <SidebarHeader className="sidebar-brand shrink-0 px-5 pb-2 pt-3">
        <button
          className="group flex min-h-[60px] items-center justify-center rounded-xl px-3 transition-colors hover:bg-white/[.035] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6a45c]/70"
          onClick={() => navigate("dashboard")}
          aria-label="Fabricante de Milhas, início"
        >
          <img
            src="/logo-sem-background.png"
            alt="Fabricante de Milhas"
            width="150"
            height="82"
            className="h-[72px] w-auto object-contain transition-transform duration-200 group-hover:scale-[1.02]"
          />
        </button>
      </SidebarHeader>
      <SidebarContent className="flex-1 gap-3 overflow-y-auto px-3 py-2">
        <SidebarGroup className="gap-1.5">
          <SidebarGroupLabel className="sidebar-group-label">
            Espaço de trabalho
          </SidebarGroupLabel>
          <SidebarMenu className="gap-2">
            {navItems.map(({ key, label, icon: FallbackIcon, soon }) => {
              const Icon = iconByRoute[key] ?? FallbackIcon;
              return (
                <SidebarMenuItem key={key}>
                  <SidebarMenuButton
                    isActive={route === key}
                    onClick={() => navigate(key)}
                    title={label}
                  >
                    <Icon size={18} strokeWidth={1.8} className="shrink-0" />
                    <span className="sidebar-item-label min-w-0 flex-1 whitespace-normal break-words text-left leading-tight">
                      {label}
                    </span>
                    {soon && (
                      <span className="sidebar-soon ml-auto shrink-0 rounded-md border border-white/10 px-1.5 py-0.5 text-[9px] font-semibold tracking-wide text-slate-500">
                        EM BREVE
                      </span>
                    )}
                    {!soon && route === key && (
                      <ChevronRight
                        size={14}
                        className="ml-auto shrink-0 text-[#c6a45c]"
                      />
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
