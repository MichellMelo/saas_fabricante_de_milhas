"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Copy, RefreshCw, Search, ShieldCheck, UserPlus, Users } from "lucide-react";

const PRODUCTS = [
  { value: "GROUP_VIP", label: "Grupo VIP" },
  { value: "AULAO", label: "Aulões" },
  { value: "MENTORSHIP", label: "Mentorias" },
] as const;

type Product = (typeof PRODUCTS)[number]["value"];
type Period = "MONTHLY" | "SEMIANNUAL" | "ANNUAL" | "CUSTOM";
const PERIODS: { value: Period; label: string; months: number | null }[] = [
  { value: "MONTHLY", label: "Mensal", months: 1 },
  { value: "SEMIANNUAL", label: "Semestral (6 meses)", months: 6 },
  { value: "ANNUAL", label: "Anual (12 meses)", months: 12 },
  { value: "CUSTOM", label: "Personalizado / sem prazo automático", months: null },
];
type Access = { id: string; product: Product; period: Period; active: boolean; startsAt: string; expiresAt: string | null };
type Client = { id: string; email: string; name: string | null; createdAt: string; productAccesses: Access[] };
type Invitation = { id: string; email: string; name: string | null; productTypes: Product[]; expiresAt: string; createdAt: string };

function toDateInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}

function dateAtLocalNoon(value: string) {
  return new Date(value + "T12:00:00").toISOString();
}

function addMonthsToDate(value: string, months: number | null) {
  if (!value || months === null) return "";
  const date = new Date(value + "T12:00:00");
  const day = date.getDate();
  date.setDate(1);
  date.setMonth(date.getMonth() + months);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(day, lastDay));
  return toDateInput(date.toISOString());
}

function isAccessActive(access?: Access) {
  return Boolean(access?.active && new Date(access.startsAt) <= new Date() && (!access.expiresAt || new Date(access.expiresAt) > new Date()));
}

function ProductAccessEditor({ label, access, onSave }: {
  label: string;
  access?: Access;
  onSave: (active: boolean, period: Period, startsAt: string, expiresAt: string) => Promise<void>;
}) {
  const [active, setActive] = useState(isAccessActive(access));
  const defaultPeriod: Period = access?.expiresAt ? (access?.period ?? "MONTHLY") : "CUSTOM";
  const [period, setPeriod] = useState<Period>(defaultPeriod);
  const initialStart = toDateInput(access?.startsAt) || toDateInput(new Date().toISOString());
  const [startsAt, setStartsAt] = useState(initialStart);
  const initialMonths = PERIODS.find((item) => item.value === defaultPeriod)?.months ?? null;
  const [expiresAt, setExpiresAt] = useState(toDateInput(access?.expiresAt) || addMonthsToDate(initialStart, initialMonths));
  const [saving, setSaving] = useState(false);

  function changePeriod(next: Period) {
    setPeriod(next);
    const months = PERIODS.find((item) => item.value === next)?.months ?? null;
    setExpiresAt(months === null ? "" : addMonthsToDate(startsAt, months));
  }

  function changeStart(next: string) {
    setStartsAt(next);
    const months = PERIODS.find((item) => item.value === period)?.months ?? null;
    if (months !== null) setExpiresAt(addMonthsToDate(next, months));
  }

  async function save() {
    setSaving(true);
    try { await onSave(active, period, startsAt, expiresAt); }
    finally { setSaving(false); }
  }

  return (
    <div className="rounded-xl border border-slate-200 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-sm font-medium text-slate-800">
          <input type="checkbox" checked={active} onChange={(event) => setActive(event.target.checked)} className="h-4 w-4 accent-[#a6792d]" />
          {label}
        </label>
        <span className={"rounded-full px-2.5 py-1 text-[11px] font-semibold " + (active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>{active ? "Ativo" : "Inativo"}</span>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium text-slate-600">Tipo de assinatura
          <select value={period} onChange={(event) => changePeriod(event.target.value as Period)} className="mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700">
            {PERIODS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-600">Data de adesão
          <input type="date" required value={startsAt} onChange={(event) => changeStart(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm text-slate-700" />
        </label>
        <label className="text-xs font-medium text-slate-600 sm:col-span-2">Data final
          <input type="date" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} disabled={period !== "CUSTOM"} className="mt-1.5 w-full rounded-lg border border-slate-200 px-2.5 py-2 text-sm text-slate-700 disabled:bg-slate-50 disabled:text-slate-500" />
          <span className="mt-1 block font-normal text-slate-400">{period === "CUSTOM" ? "Defina a data final ou deixe em branco para não expirar automaticamente." : "Calculada automaticamente a partir da data de adesão."}</span>
        </label>
      </div>
      <button type="button" onClick={() => void save()} disabled={saving || !startsAt} className="mt-3 rounded-lg bg-[#101a2b] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">{saving ? "Salvando..." : "Salvar acesso"}</button>
    </div>
  );
}

export function ClientManagement({ onBack }: { onBack: () => void }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [products, setProducts] = useState<Product[]>(["GROUP_VIP"]);
  const [inviteUrl, setInviteUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [clientQuery, setClientQuery] = useState("");
  const [accessFilter, setAccessFilter] = useState<"all" | "active" | "none">("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [clientResponse, inviteResponse] = await Promise.all([
        fetch("/api/admin/clients", { cache: "no-store" }),
        fetch("/api/admin/invitations", { cache: "no-store" }),
      ]);
      const clientData = await clientResponse.json().catch(() => ({}));
      const inviteData = await inviteResponse.json().catch(() => ({}));
      if (!clientResponse.ok || !inviteResponse.ok) {
        const payload = !clientResponse.ok ? clientData : inviteData;
        const message = payload.message;
        throw new Error(Array.isArray(message) ? message.join(" ") : message || "Não foi possível carregar a gestão de clientes.");
      }
      setClients(clientData);
      setInvitations(inviteData);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  function toggleProduct(product: Product) {
    setProducts((current) => current.includes(product) ? current.filter((item) => item !== product) : [...current, product]);
  }

  async function createInvitation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    setInviteUrl("");
    try {
      const response = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined, products }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = result.message;
        throw new Error(Array.isArray(message) ? message.join(" ") : message || "Não foi possível criar o convite.");
      }
      setInviteUrl(result.inviteUrl);
      setNotice("Convite criado. Copie o link e envie ao cliente por um canal seguro. O link expira em 7 dias.");
      setEmail("");
      setName("");
      setProducts(["GROUP_VIP"]);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível criar o convite.");
    } finally {
      setSaving(false);
    }
  }

  async function updateAccess(client: Client, product: Product, active: boolean, period: Period, startsAt: string, expiresAt: string) {
    setError("");
    setNotice("");
    try {
      const response = await fetch(`/api/admin/clients/${encodeURIComponent(client.id)}/product-access`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product, active, period, startsAt: dateAtLocalNoon(startsAt), expiresAt: expiresAt ? dateAtLocalNoon(expiresAt) : null }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = result.message;
        throw new Error(Array.isArray(message) ? message.join(" ") : message || "Não foi possível atualizar o acesso.");
      }
      setNotice(`Acesso de ${client.name || client.email} atualizado.`);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível atualizar o acesso.");
    }
  }

  async function copyInvite() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setNotice("Link do convite copiado.");
    } catch {
      setNotice("Copie o link exibido no campo abaixo.");
    }
  }

  const normalizedQuery = clientQuery.trim().toLocaleLowerCase("pt-BR");
  const filteredClients = clients.filter((client) => {
    const matchesQuery = !normalizedQuery || [client.name ?? "", client.email].some((value) => value.toLocaleLowerCase("pt-BR").includes(normalizedQuery));
    const hasActiveAccess = client.productAccesses.some((access) => isAccessActive(access));
    const matchesAccess = accessFilter === "all" || (accessFilter === "active" ? hasActiveAccess : !hasActiveAccess);
    return matchesQuery && matchesAccess;
  });

  return (
    <section className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a6792d]">Administração · Clientes</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Clientes e produtos</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Crie convites e controle o acesso de cada cliente ao Grupo VIP, aulões e mentorias. A API valida as permissões no servidor.</p>
        </div>
        <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"><RefreshCw size={15} /> Atualizar</button>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}

      <div className="grid gap-5 xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f6f0e2] text-[#9a7129]"><UserPlus size={19} /></span>
            <div><h2 className="font-semibold text-slate-900">Convidar cliente</h2><p className="mt-1 text-xs text-slate-500">O convite é válido por 7 dias.</p></div>
          </div>
          <form onSubmit={createInvitation} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-slate-700">E-mail do cliente
              <input type="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-[#b58a37] focus:ring-2 focus:ring-[#d6b66f]/20" placeholder="cliente@exemplo.com" />
            </label>
            <label className="block text-sm font-medium text-slate-700">Nome <span className="font-normal text-slate-400">(opcional)</span>
              <input maxLength={100} value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-[#b58a37] focus:ring-2 focus:ring-[#d6b66f]/20" placeholder="Nome do cliente" />
            </label>
            <fieldset>
              <legend className="text-sm font-medium text-slate-700">Produtos liberados</legend>
              <div className="mt-3 space-y-2">
                {PRODUCTS.map((product) => <label key={product.value} className="flex items-center gap-3 rounded-xl border border-slate-200 px-3.5 py-3 text-sm text-slate-700">
                  <input type="checkbox" checked={products.includes(product.value)} onChange={() => toggleProduct(product.value)} className="h-4 w-4 accent-[#a6792d]" />
                  {product.label}
                </label>)}
              </div>
            </fieldset>
            <button type="submit" disabled={saving || products.length === 0} className="w-full rounded-xl bg-[#101a2b] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Criando convite..." : "Criar convite seguro"}</button>
          </form>
          {inviteUrl && <div className="mt-5 rounded-xl border border-[#e7d7ad] bg-[#fcf8ed] p-4">
            <p className="text-sm font-semibold text-slate-900">Link de ativação</p>
            <input readOnly value={inviteUrl} onFocus={(event) => event.currentTarget.select()} className="mt-2 w-full rounded-lg border border-[#e7d7ad] bg-white px-3 py-2 text-xs text-slate-700" aria-label="Link do convite" />
            <button onClick={() => void copyInvite()} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[#101a2b] px-3 py-2 text-xs font-semibold text-white"><Copy size={13} /> Copiar link</button>
            <p className="mt-2 text-xs leading-5 text-slate-500">O link contém um token de uso único. Envie apenas ao destinatário correto.</p>
          </div>}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700"><Users size={19} /></span>
            <div><h2 className="font-semibold text-slate-900">Base de clientes</h2><p className="mt-1 text-xs text-slate-500">{clients.length} contas cadastradas · {clients.filter((client) => client.productAccesses.some((access) => isAccessActive(access))).length} com acesso ativo</p></div>
          </div>
          {!loading && clients.length > 0 && <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
            <label className="relative block">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={clientQuery} onChange={(event) => setClientQuery(event.target.value)} placeholder="Buscar por nome ou e-mail" aria-label="Buscar clientes por nome ou e-mail" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#b58a37] focus:ring-2 focus:ring-[#d6b66f]/20" />
            </label>
            <select value={accessFilter} onChange={(event) => setAccessFilter(event.target.value as "all" | "active" | "none")} aria-label="Filtrar clientes por acesso" className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-[#b58a37]">
              <option value="all">Todos os clientes</option>
              <option value="active">Com acesso ativo</option>
              <option value="none">Sem acesso ativo</option>
            </select>
          </div>}
          {loading ? <p className="py-10 text-sm text-slate-500">Carregando clientes...</p> : clients.length === 0 ? <p className="py-10 text-sm text-slate-500">Nenhum usuário cadastrado ainda.</p> : filteredClients.length === 0 ? <p className="py-10 text-sm text-slate-500">Nenhum cliente corresponde aos filtros selecionados.</p> : <div className="mt-5 space-y-4">
            {filteredClients.map((client) => <article key={client.id} className="rounded-xl border border-slate-200 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div><h3 className="font-semibold text-slate-900">{client.name || "Sem nome"}</h3><p className="mt-1 text-xs text-slate-500">{client.email}</p></div>
                <span className="text-[11px] text-slate-400">Desde {new Date(client.createdAt).toLocaleDateString("pt-BR")}</span>
              </div>
              <div className="mt-4 space-y-3">
                {PRODUCTS.map((product) => {
                  const access = client.productAccesses.find((item) => item.product === product.value);
                  return <ProductAccessEditor key={product.value} label={product.label} access={access} onSave={(active, period, startsAt, expiresAt) => updateAccess(client, product.value, active, period, startsAt, expiresAt)} />;
                })}
              </div>
            </article>)}
          </div>}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3"><ShieldCheck size={19} className="text-[#a6792d]" /><div><h2 className="font-semibold text-slate-900">Convites pendentes</h2><p className="mt-1 text-xs text-slate-500">Convites ativos ainda não utilizados.</p></div></div>
        {invitations.length === 0 ? <p className="mt-5 text-sm text-slate-500">Nenhum convite pendente.</p> : <div className="mt-4 divide-y divide-slate-100">
          {invitations.map((invitation) => <div key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div><p className="text-sm font-medium text-slate-800">{invitation.email}</p><p className="mt-1 text-xs text-slate-500">{invitation.productTypes.map((item) => PRODUCTS.find((p) => p.value === item)?.label ?? item).join(" · ")}</p></div>
            <p className="text-xs text-slate-500">Expira em {new Date(invitation.expiresAt).toLocaleDateString("pt-BR")}</p>
          </div>)}
        </div>}
      </div>
      <button onClick={onBack} className="text-sm font-semibold text-slate-600 hover:text-slate-900">← Voltar ao painel</button>
    </section>
  );
}
