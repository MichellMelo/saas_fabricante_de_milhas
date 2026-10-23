"use client";

import { CircleHelp, LayoutDashboard, CreditCard, Calculator, Plane, Clock3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type DashboardRoute = "dashboard" | "programas" | "calculadoras" | "passagens" | "historico" | "programas-admin" | "clientes-admin" | "grupo-vip" | "auloes" | "mentorias" | "financeiro";
export type SidebarNavItem = { key: DashboardRoute; label: string; icon: LucideIcon; soon?: boolean };

export function DashboardSidebar({ mobileOpen, route, navItems, navigate, notify }: {
  mobileOpen: boolean;
  route: DashboardRoute;
  navItems: SidebarNavItem[];
  navigate: (route: DashboardRoute) => void;
  notify: (message: string) => void;
}) {
  return (
    <aside
            className={"sidebar " + (mobileOpen ? "is-open" : "")}
            aria-label="Navegação principal"
          >
            <button
              className="brand text-left"
              onClick={() => navigate("dashboard")}
              aria-label="Fabricante de Milhas, início"
            >
              <img
                src="/logo-sem-background.png"
                alt="Fabricante de Milhas"
                width="160"
                height="47"
                className="brand-logo"
              />
            </button>
            <div className="workspace-label">ESPAÇO DE TRABALHO</div>
            <nav className="nav-list">
              {navItems.map(({ key, label, icon: Icon, soon }) => (
                <button
                  key={key}
                  className={"nav-item " + (route === key ? "is-active" : "")}
                  onClick={() => navigate(key)}
                  aria-current={route === key ? "page" : undefined}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                  {soon && <span className="nav-soon">EM BREVE</span>}
                </button>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <div className="help-card">
                <CircleHelp size={18} className="help-icon" />
                <div>
                  <strong>Precisa de ajuda?</strong>
                  <p>Entenda como usar seu painel.</p>
                  <button
                    className="text-link"
                    onClick={() =>
                      notify(
                        "Dica: compare custo por milheiro, taxas e valor real do resgate antes de decidir.",
                      )
                    }
                  >
                    Ver guia rápido ↗
                  </button>
                </div>
              </div>
              <div className="sidebar-footer">
                <span className="status-dot" /> Ambiente de demonstração{" "}
                <span className="version">v0.2</span>
              </div>
            </div>
          </aside>
  );
}
