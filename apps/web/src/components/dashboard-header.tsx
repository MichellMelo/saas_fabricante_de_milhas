"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, ChevronDown, Menu, X, PanelLeftClose, PanelLeftOpen, UserRound, LockKeyhole } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";

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
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [accountTab, setAccountTab] = useState<"profile" | "password">("profile");
  const [accountName, setAccountName] = useState(user.name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [accountBusy, setAccountBusy] = useState(false);
  const [accountMessage, setAccountMessage] = useState("");
  const [accountError, setAccountError] = useState("");
  const notificationRef = useRef<HTMLDivElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!notificationsOpen) return;
    const handleOutsideClick = (event: PointerEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener("pointerdown", handleOutsideClick);
    return () => document.removeEventListener("pointerdown", handleOutsideClick);
  }, [notificationsOpen]);

  return (
    <header className="topbar">
      <div className="topbar-leading">
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
              <Breadcrumb className="breadcrumbs">
                <BreadcrumbList className="gap-2">
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/" className="text-slate-400 hover:text-white">Workspace</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator className="text-slate-500" />
                  <BreadcrumbItem>
                    <BreadcrumbPage className="text-white">{title}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
      </div>
              <div className="topbar-actions">
                {user.isAdmin && <div ref={notificationRef} className="relative">
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
                    {expiringAccesses.length > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold leading-none text-white">{expiringAccesses.length > 9 ? "9+" : expiringAccesses.length}</span>}
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
                <div ref={accountMenuRef} className="relative">
                  <button type="button" className="profile-chip" aria-haspopup="menu" aria-expanded={accountMenuOpen} onClick={() => setAccountMenuOpen((open) => !open)}>
                    <span className="avatar">FM</span><span className="profile-name">{user.name?.trim() || user.email}</span><ChevronDown size={13} className="chevron" />
                  </button>
                  {accountMenuOpen && <div role="menu" className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 text-slate-800 shadow-xl">
                    <button role="menuitem" type="button" onClick={() => { setAccountName(user.name ?? ""); setAccountMessage(""); setAccountError(""); setAccountTab("profile"); setAccountDialogOpen(true); setAccountMenuOpen(false); }} className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-slate-50"><UserRound size={16}/> Minha conta</button>
                  </div>}
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                >
                  Sair
                </button>
              </div>

              {accountDialogOpen && <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !accountBusy) setAccountDialogOpen(false); }}>
                <section role="dialog" aria-modal="true" aria-labelledby="account-dialog-title" className="w-full max-w-lg rounded-2xl bg-white p-5 text-slate-900 shadow-2xl sm:p-7">
                  <div className="flex items-start justify-between gap-4"><div><h2 id="account-dialog-title" className="text-xl font-semibold">Minha conta</h2><p className="mt-1 text-sm text-slate-500">Gerencie seus dados de acesso.</p></div><button type="button" aria-label="Fechar" disabled={accountBusy} onClick={() => setAccountDialogOpen(false)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18}/></button></div>
                  <div className="mt-5 grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
                    <button type="button" onClick={() => { setAccountTab("profile"); setAccountMessage(""); setAccountError(""); }} className={"rounded-lg px-3 py-2 text-sm font-medium " + (accountTab === "profile" ? "bg-white shadow-sm" : "text-slate-500")}>Dados pessoais</button>
                    <button type="button" onClick={() => { setAccountTab("password"); setAccountMessage(""); setAccountError(""); }} className={"rounded-lg px-3 py-2 text-sm font-medium " + (accountTab === "password" ? "bg-white shadow-sm" : "text-slate-500")}>Alterar senha</button>
                  </div>
                  {accountMessage && <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{accountMessage}</p>}
                  {accountError && <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{accountError}</p>}
                  {accountTab === "profile" ? <form className="mt-5 space-y-4" onSubmit={async (event) => {
                    event.preventDefault(); setAccountBusy(true); setAccountError(""); setAccountMessage("");
                    try { const response = await fetch("/api/auth/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: accountName.trim() }) }); const result = await response.json().catch(() => ({})); if (!response.ok) throw new Error(Array.isArray(result.message) ? result.message.join(" ") : result.message || "Não foi possível salvar seus dados."); setAccountMessage("Dados atualizados. Recarregue a página para atualizar o nome no cabeçalho."); }
                    catch (error) { setAccountError(error instanceof Error ? error.message : "Falha ao salvar os dados."); } finally { setAccountBusy(false); }
                  }}>
                    <label className="block text-sm font-medium">Nome<input value={accountName} onChange={(event) => setAccountName(event.target.value)} maxLength={100} required className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-[#c6a45c] focus:ring-2 focus:ring-[#c6a45c]/20"/></label>
                    <label className="block text-sm font-medium">E-mail<input value={user.email} readOnly className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-slate-500"/></label>
                    <p className="text-xs leading-5 text-slate-500">O e-mail é usado para entrar na plataforma e não pode ser alterado por esta tela.</p>
                    <button disabled={accountBusy || !accountName.trim()} className="w-full rounded-xl bg-[#111b2b] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50">{accountBusy ? "Salvando..." : "Salvar alterações"}</button>
                  </form> : <form className="mt-5 space-y-4" onSubmit={async (event) => {
                    event.preventDefault(); setAccountError(""); setAccountMessage("");
                    if (newPassword.length < 8) { setAccountError("A nova senha deve ter pelo menos 8 caracteres."); return; }
                    if (newPassword !== confirmPassword) { setAccountError("A confirmação da senha não confere."); return; }
                    setAccountBusy(true);
                    try { const response = await fetch("/api/auth/change-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword, newPassword }) }); const result = await response.json().catch(() => ({})); if (!response.ok) throw new Error(Array.isArray(result.message) ? result.message.join(" ") : result.message || "Não foi possível alterar a senha."); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setAccountMessage("Senha alterada com sucesso."); }
                    catch (error) { setAccountError(error instanceof Error ? error.message : "Falha ao alterar a senha."); } finally { setAccountBusy(false); }
                  }}>
                    <label className="block text-sm font-medium">Senha atual<input type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-[#c6a45c]"/></label>
                    <label className="block text-sm font-medium">Nova senha<input type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-[#c6a45c]"/><span className="mt-1 block text-xs text-slate-500">Use pelo menos 8 caracteres.</span></label>
                    <label className="block text-sm font-medium">Confirmar nova senha<input type="password" autoComplete="new-password" minLength={8} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required className="mt-1.5 block w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-[#c6a45c]"/></label>
                    <button disabled={accountBusy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#111b2b] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"><LockKeyhole size={16}/>{accountBusy ? "Atualizando..." : "Alterar senha"}</button>
                  </form>}
                </section>
              </div>}
            </header>
  );
}
