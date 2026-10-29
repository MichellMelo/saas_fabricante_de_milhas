"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ShieldCheck, UserRoundPlus, RefreshCw, Ban, Copy, Clock3, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Admin = { id: string; email: string; name: string | null; active: boolean; source: "environment" | "database"; createdAt: string; lastLoginAt: string | null };
type Client = { id: string; email: string; name: string | null; active: boolean; hasAccount: boolean; createdAt: string; lastLoginAt: string | null };
type Invitation = { id: string; email: string; name: string | null; expiresAt: string; emailStatus: string; emailAttempts: number; lastEmailError: string | null; createdAt: string };
type Audit = { id: string; targetEmail: string; action: string; createdAt: string; actor: { name: string | null; email: string } | null; details: unknown };
type Snapshot = { administrators: Admin[]; clients: Client[]; invitations: Invitation[] };

export function AdminManagement({ onBack }: { onBack: () => void }) {
  const [snapshot, setSnapshot] = useState<Snapshot>({ administrators: [], clients: [], invitations: [] });
  const [audit, setAudit] = useState<Audit[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [password, setPassword] = useState("");
  const [action, setAction] = useState<{ type: "promote" | "revoke"; id: string; label: string } | null>(null);
  const [inviteLink, setInviteLink] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [adminResponse, auditResponse] = await Promise.all([
        fetch("/api/admin/administrators", { cache: "no-store" }),
        fetch("/api/admin/administrators/audit", { cache: "no-store" }),
      ]);
      const adminData = await adminResponse.json().catch(() => ({}));
      const auditData = await auditResponse.json().catch(() => []);
      if (!adminResponse.ok) throw new Error(adminData.message || "Não foi possível carregar a gestão de administradores.");
      setSnapshot(adminData);
      if (auditResponse.ok && Array.isArray(auditData)) setAudit(auditData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function createInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(""); setNotice(""); setInviteLink("");
    try {
      const response = await fetch("/api/admin/administrators/invitations", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Não foi possível criar o convite.");
      setInviteLink(data.inviteUrl || "");
      setNotice(data.message || "Convite administrativo criado.");
      setEmail(""); setName("");
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Erro ao criar convite."); }
    finally { setBusy(false); }
  }

  async function confirmAction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!action) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/admin/administrators/${action.id}/${action.type}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Não foi possível concluir a alteração.");
      setNotice(action.type === "promote" ? "Privilégio administrativo concedido." : "Privilégio administrativo revogado. A conta e o histórico foram preservados.");
      setPassword(""); setAction(null);
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Erro ao atualizar privilégio."); }
    finally { setBusy(false); }
  }

  async function invitationAction(id: string, operation: "cancel" | "resend") {
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/admin/administrators/invitations/${id}/${operation}`, { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Não foi possível atualizar o convite.");
      setNotice(data.message || (operation === "cancel" ? "Convite cancelado." : "Reenvio solicitado."));
      await load();
    } catch (e) { setError(e instanceof Error ? e.message : "Erro ao atualizar convite."); }
    finally { setBusy(false); }
  }

  const filteredClients = snapshot.clients.filter((client) => {
    const query = clientSearch.trim().toLowerCase();
    return query && (client.email.toLowerCase().includes(query) || (client.name ?? "").toLowerCase().includes(query));
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <button onClick={onBack} className="mb-3 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900"><ArrowLeft size={15} /> Voltar ao painel</button>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#a6792d]">Segurança e acessos</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">Gestão de administradores</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Conceda ou revogue acesso administrativo completo. As alterações críticas exigem confirmação da sua senha.</p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw size={15} className="mr-2" /> Atualizar</Button>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5"><p className="text-sm text-slate-500">Administradores</p><p className="mt-2 text-3xl font-semibold">{snapshot.administrators.length}</p><p className="mt-1 text-xs text-slate-500">Acesso completo às ferramentas administrativas</p></Card>
        <Card className="p-5"><p className="text-sm text-slate-500">Convites pendentes</p><p className="mt-2 text-3xl font-semibold">{snapshot.invitations.length}</p><p className="mt-1 text-xs text-slate-500">Acesso só é ativado após aceitação</p></Card>
        <Card className="p-5"><p className="text-sm text-slate-500">Registros de auditoria</p><p className="mt-2 text-3xl font-semibold">{audit.length}</p><p className="mt-1 text-xs text-slate-500">Últimos eventos administrativos</p></Card>
      </div>

      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-2"><UserRoundPlus size={19} className="text-[#a6792d]" /><h2 className="text-lg font-semibold">Convidar por e-mail</h2></div>
        <p className="mt-1 text-sm text-slate-600">Para alguém sem conta ativa. O convite expira em sete dias e só concede acesso após a pessoa criar a senha e aceitar.</p>
        <form onSubmit={createInvitation} className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input type="email" required maxLength={254} placeholder="E-mail da pessoa" value={email} onChange={(e) => setEmail(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#b58a37]" />
          <input type="text" maxLength={100} placeholder="Nome (opcional)" value={name} onChange={(e) => setName(e.target.value)} className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#b58a37]" />
          <Button type="submit" disabled={busy}><UserRoundPlus size={15} className="mr-2" /> Enviar convite</Button>
        </form>
        {inviteLink && <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3"><p className="text-sm font-medium text-amber-950">Link de convite para envio manual</p><p className="mt-1 break-all text-xs text-amber-900">{inviteLink}</p><Button variant="outline" size="sm" className="mt-2" onClick={() => void navigator.clipboard.writeText(inviteLink)}><Copy size={14} className="mr-2" /> Copiar link</Button></div>}
      </Card>

      <Card className="p-5 sm:p-6">
        <div className="flex items-center gap-2"><ShieldCheck size={19} className="text-[#a6792d]" /><h2 className="text-lg font-semibold">Administradores atuais</h2></div>
        {loading ? <p className="py-8 text-sm text-slate-500">Carregando...</p> : snapshot.administrators.length === 0 ? <p className="py-8 text-sm text-slate-500">Nenhum administrador encontrado.</p> : (
          <div className="mt-4 divide-y divide-slate-100">{snapshot.administrators.map((admin) => <div key={admin.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
            <div><p className="font-medium text-slate-900">{admin.name || admin.email}</p><p className="text-sm text-slate-500">{admin.email}</p><p className="mt-1 text-xs text-slate-500">{admin.active ? "Conta ativa" : "Conta inativa"} · {admin.source === "environment" ? "Configurado em ADMIN_EMAILS" : "Gerenciado no sistema"} · Último acesso: {admin.lastLoginAt ? new Date(admin.lastLoginAt).toLocaleString("pt-BR") : "Não registrado"}</p></div>
            {admin.source === "database" && <Button variant="outline" size="sm" disabled={busy || snapshot.administrators.filter((a) => a.active).length <= 1} onClick={() => setAction({ type: "revoke", id: admin.id, label: admin.name || admin.email })}><Ban size={14} className="mr-2" /> Revogar acesso</Button>}
          </div>)}</div>
        )}
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Promover cliente existente</h2>
        <p className="mt-1 text-sm text-slate-600">A conta precisa estar ativa e já ter senha definida. Os dados, pagamentos e histórico permanecem vinculados à mesma conta.</p>
        <input type="search" placeholder="Buscar cliente por nome ou e-mail" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} className="mt-4 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-[#b58a37]" />
        <div className="mt-3 divide-y divide-slate-100">{clientSearch.trim() && filteredClients.length === 0 ? <p className="py-4 text-sm text-slate-500">Nenhum cliente elegível encontrado.</p> : filteredClients.slice(0, 10).map((client) => <div key={client.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-medium text-slate-900">{client.name || client.email}</p><p className="text-sm text-slate-500">{client.email}</p><p className="text-xs text-slate-500">{client.hasAccount ? "Conta com senha definida" : "Precisa aceitar convite e criar senha"} · {client.active ? "Ativa" : "Inativa"}</p></div><Button variant="outline" size="sm" disabled={busy || !client.active || !client.hasAccount} onClick={() => setAction({ type: "promote", id: client.id, label: client.name || client.email })}><ShieldCheck size={14} className="mr-2" /> Promover</Button></div>)}</div>
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Convites pendentes</h2>
        {snapshot.invitations.length === 0 ? <p className="py-5 text-sm text-slate-500">Nenhum convite pendente.</p> : <div className="mt-3 divide-y divide-slate-100">{snapshot.invitations.map((invite) => <div key={invite.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-medium">{invite.name || invite.email}</p><p className="text-sm text-slate-500">{invite.email}</p><p className="mt-1 text-xs text-slate-500"><Clock3 size={12} className="mr-1 inline" /> Expira em {new Date(invite.expiresAt).toLocaleDateString("pt-BR")} · {invite.emailStatus} · {invite.emailAttempts} tentativa(s)</p>{invite.lastEmailError && <p className="mt-1 text-xs text-red-600">{invite.lastEmailError}</p>}</div><div className="flex gap-2"><Button variant="outline" size="sm" disabled={busy} onClick={() => void invitationAction(invite.id, "resend")}><RefreshCw size={13} className="mr-1" /> Reenviar</Button><Button variant="outline" size="sm" disabled={busy} onClick={() => void invitationAction(invite.id, "cancel")}><Ban size={13} className="mr-1" /> Cancelar</Button></div></div>)}</div>}
      </Card>

      <Card className="p-5 sm:p-6">
        <h2 className="text-lg font-semibold">Auditoria administrativa</h2>
        {audit.length === 0 ? <p className="py-5 text-sm text-slate-500">Ainda não há eventos registrados.</p> : <div className="mt-3 divide-y divide-slate-100">{audit.map((entry) => <div key={entry.id} className="py-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium text-slate-900">{entry.action.replaceAll("_", " ")}</p><p className="text-xs text-slate-500">{new Date(entry.createdAt).toLocaleString("pt-BR")}</p></div><p className="mt-1 text-sm text-slate-600">Alvo: {entry.targetEmail} · Por: {entry.actor?.name || entry.actor?.email || "Sistema"}</p></div>)}</div>}
      </Card>

      {action && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4" role="presentation"><div role="dialog" aria-modal="true" aria-labelledby="admin-confirm-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><div className="flex items-center gap-2">{action.type === "promote" ? <ShieldCheck size={20} /> : <AlertCircle size={20} />}<h2 id="admin-confirm-title" className="text-lg font-semibold">{action.type === "promote" ? "Confirmar promoção" : "Confirmar revogação"}</h2></div><p className="mt-3 text-sm text-slate-600">{action.type === "promote" ? `Conceder acesso administrativo completo a ${action.label}?` : `Remover o privilégio administrativo de ${action.label}? A conta e o histórico serão preservados.`}</p><form onSubmit={confirmAction} className="mt-4 space-y-3"><label className="block text-sm font-medium">Sua senha atual<input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" /></label><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => { setAction(null); setPassword(""); }}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? "Processando..." : "Confirmar"}</Button></div></form></div></div>}
    </div>
  );
}
