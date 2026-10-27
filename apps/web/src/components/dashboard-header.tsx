"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, ChevronDown, Menu, X, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

type DashboardUser = { id: string; email: string; name: string | null; createdAt: string; isAdmin?: boolean };
type ExpiringAccess = {
  id: string;
  product: "GROUP_VIP" | "AULAO" | "MENTORSHIP";
  expiresAt: string;
  user: { id: string; name: string | null; email: string };
};
const PRODUCT_LABELS: Record<ExpiringAccess["product"], string> = {
  GROUP_VIP: "Grupo VIP",
  AULAO: "Aulões",
  MENTORSHIP: "Mentorias",
};

export function DashboardHeader({ title, mobileOpen, onToggleMobile, desktopSidebarCollapsed, onToggleDesktopSidebar, user, onLogout }: {
  title: string;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  desktopSidebarCollapsed: boolean;
  onToggleDesktopSidebar: () => void;
  notify: (message: string) => void;
  user: DashboardUser;
  onLogout: () => void;
}) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [expiringAccesses, setExpiringAccesses] = useState<ExpiringAccess[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");

  const loadExpiringAccesses = useCallback(async () => {
    if (!user.isAdmin) return;
    setNotificationsLoading(true);
    setNotificationsError("");
    try {
      const response = await fetch("/api/admin/clients/expiring-access", { cache: "no-store" });
      const payload = await response.json().catch(() => []);
      if (!response.ok) throw new Error(payload.message || "Não foi possível carregar os avisos.");
      setExpiringAccesses(Array.isArray(payload) ? payload : []);
    } catch (cause) {
      setNotificationsError(cause instanceof Error ? cause.message : "Falha ao carregar notificações.");
    } finally {
      setNotificationsLoading(false);
    }
  }, [user.isAdmin]);

  useEffect(() => { void loadExpiringAccesses(); }, [loadExpiringAccesses]);

  return (
    <header className="topbar">
              <Button
                variant="ghost"
                size="icon"
                className="menu-toggle"
                onClick={onToggleMobile}
                aria-label={mobileOpen ? "Fechar navegação" : "Abrir navegação"}
              >
                {mobileOpen ? <X size={18} /> : <Menu size={18} />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="hidden md:inline-flex"
                onClick={onToggleDesktopSidebar}
                aria-label={desktopSidebarCollapsed ? "Expandir barra lateral" : "Recolher barra lateral"}
                title={desktopSidebarCollapsed ? "Mostrar barra lateral" : "Ocultar barra lateral"}
              >
                {desktopSidebarCollapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              </Button>
              <div className="breadcrumbs">
                <span>Workspace</span>
                <span className="text-slate-300">/</span>
                <strong>
                  {title}
                </strong>
              </div>
              <div className="topbar-actions">
                {user.isAdmin && <div className="relative">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Notificações de vencimento: ${expiringAccesses.length}`}
                    aria-expanded={notificationsOpen}
                    className="relative"
                    onClick={() => {
                      const nextOpen = !notificationsOpen;
                      setNotificationsOpen(nextOpen);
                      if (nextOpen) void loadExpiringAccesses();
                    }}
                  >
                    <Bell size={18} />
                    {expiringAccesses.length > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">{expiringAccesses.length > 9 ? "9+" : expiringAccesses.length}</span>}
                  </Button>
                  {notificationsOpen && <div className="absolute right-0 z-50 mt-2 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <div><p className="text-sm font-semibold text-slate-900">Acessos perto do vencimento</p><p className="mt-0.5 text-xs text-slate-500">Próximos 3 dias</p></div>
                      <button type="button" onClick={() => void loadExpiringAccesses()} className="text-xs font-medium text-slate-500 hover:text-slate-900">Atualizar</button>
                    </div>
                    {notificationsLoading ? <p className="px-4 py-5 text-sm text-slate-500">Verificando vencimentos...</p>
                      : notificationsError ? <p className="px-4 py-5 text-sm text-red-600">{notificationsError}</p>
                      : expiringAccesses.length === 0 ? <p className="px-4 py-5 text-sm text-slate-500">Nenhum acesso ativo vence nos próximos 3 dias.</p>
                      : <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                        {expiringAccesses.map((access) => <li key={access.id} className="px-4 py-3">
                          <p className="text-sm font-semibold text-slate-800">{access.user.name?.trim() || access.user.email}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{PRODUCT_LABELS[access.product]} · {access.user.email}</p>
                          <p className="mt-1 text-xs font-semibold text-red-700">Vence em {new Date(access.expiresAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
                        </li>)}
                      </ul>}
                  </div>}
                </div>}
                <div className="profile-chip">
                  <span className="avatar">FM</span>
                  <span className="profile-name">
                    {user.name?.trim() || user.email}
                  </span>
                  <ChevronDown size={13} className="chevron" />
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  Sair
                </button>
              </div>
            </header>
  );
}
