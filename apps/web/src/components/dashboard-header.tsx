"use client";

import { Bell, ChevronDown, Menu, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type DashboardUser = { id: string; email: string; name: string | null; createdAt: string };

export function DashboardHeader({ title, mobileOpen, onToggleMobile, notify, user, onLogout }: {
  title: string;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  notify: (message: string) => void;
  user: DashboardUser;
  onLogout: () => void;
}) {
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
              <div className="breadcrumbs">
                <span>Workspace</span>
                <span className="text-slate-300">/</span>
                <strong>
                  {title}
                </strong>
              </div>
              <div className="topbar-actions">
                <Badge variant="gold" className="demo-pill">
                  <span /> DEMONSTRAÇÃO
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Ver notificações"
                  className="relative"
                  onClick={() =>
                    notify(
                      "Você está em um ambiente de demonstração. Não há notificações reais.",
                    )
                  }
                >
                  <Bell size={18} />
                  <i className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full border border-white bg-gold" />
                </Button>
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
