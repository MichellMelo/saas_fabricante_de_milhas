"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ChevronDown, Copy, RefreshCw, Search, ShieldCheck, UserPlus, Users } from "lucide-react";

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
type Client = { id: string; email: string; name: string | null; phone: string | null; notes: string | null; active: boolean; hasAccount: boolean; createdAt: string; productAccesses: Access[] };
type Invitation = { id: string; email: string; name: string | null; productTypes: Product[]; expiresAt: string; createdAt: string };
type Payment = { id: string; userId: string; product: Product; amount: string | number; dueAt: string; status: "PENDING" | "PAID" | "CANCELLED"; method: "PIX" | "BANK_TRANSFER" | "CREDIT_CARD" | "CASH" | "OTHER" | null; paidAt: string | null; notes: string | null; createdAt: string; user?: { id: string; name: string | null; email: string } };
const PAYMENT_METHODS = [{ value: "PIX", label: "Pix" }, { value: "BANK_TRANSFER", label: "Transferência" }, { value: "CREDIT_CARD", label: "Cartão" }, { value: "CASH", label: "Dinheiro" }, { value: "OTHER", label: "Outro" }] as const;
function paymentStatus(payment: Payment) {
  if (payment.status === "PAID") return "Pago";
  if (payment.status === "CANCELLED") return "Cancelado";
  return new Date(payment.dueAt) < new Date() ? "Vencido" : "Pendente";
}
function money(value: number | string) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

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

function ClientProfileEditor({ client, onSave }: {
  client: Client;
  onSave: (values: { email: string; name: string; phone: string; notes: string }) => Promise<void>;
}) {
  const [email, setEmail] = useState(client.email);
  const [name, setName] = useState(client.name ?? "");
  const [phone, setPhone] = useState(client.phone ?? "");
  const [notes, setNotes] = useState(client.notes ?? "");
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    try { await onSave({ email, name, phone, notes }); } finally { setSaving(false); }
  }
  return <form onSubmit={(event) => void submit(event)} className="rounded-xl border border-slate-200 bg-white p-3">
    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Dados cadastrais</p>
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-medium text-slate-600">Nome<input maxLength={100} value={name} onChange={(event) => setName(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
      <label className="text-xs font-medium text-slate-600">E-mail<input type="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
      <label className="text-xs font-medium text-slate-600">Telefone<input type="tel" maxLength={40} value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
      <label className="text-xs font-medium text-slate-600 sm:col-span-2">Observações<textarea maxLength={5000} rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
    </div>
    <button type="submit" disabled={saving} className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50">{saving ? "Salvando..." : "Salvar dados cadastrais"}</button>
  </form>;
}

function ClientPayments({ client, payments, onCreate, onSetPaid }: {
  client: Client;
  payments: Payment[];
  onCreate: (values: { userId: string; product: Product; amount: number; dueAt: string; method: Payment["method"]; notes: string }) => Promise<void>;
  onSetPaid: (payment: Payment, paid: boolean) => Promise<void>;
}) {
  const [product, setProduct] = useState<Product>("GROUP_VIP");
  const [amount, setAmount] = useState("");
  const [dueAt, setDueAt] = useState(new Date().toISOString().slice(0, 10));
  const [method, setMethod] = useState<Payment["method"]>("PIX");
  const [notes, setNotes] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true);
    try { await onCreate({ userId: client.id, product, amount: Number(amount), dueAt: new Date(dueAt + "T12:00:00").toISOString(), method, notes }); setAmount(""); setNotes(""); setShowForm(false); }
    finally { setSaving(false); }
  }
  return <section className="rounded-xl border border-slate-200 bg-white p-3">
    <div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="text-sm font-semibold text-slate-900">Pagamentos e vencimentos</h3><p className="mt-1 text-xs text-slate-500">{payments.length} lançamento(s)</p></div><button type="button" onClick={() => setShowForm((value) => !value)} className="rounded-lg bg-[#101a2b] px-3 py-2 text-xs font-semibold text-white">{showForm ? "Fechar formulário" : "Novo lançamento"}</button></div>
    {showForm && <form onSubmit={(event) => void submit(event)} className="mt-3 grid gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-2">
      <label className="text-xs font-medium text-slate-600">Produto<select value={product} onChange={(event) => setProduct(event.target.value as Product)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">{PRODUCTS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label className="text-xs font-medium text-slate-600">Valor (R$)<input type="number" required min="0.01" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0,00" className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
      <label className="text-xs font-medium text-slate-600">Vencimento<input type="date" required value={dueAt} onChange={(event) => setDueAt(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
      <label className="text-xs font-medium text-slate-600">Forma de pagamento<select value={method ?? "OTHER"} onChange={(event) => setMethod(event.target.value as Payment["method"])} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">{PAYMENT_METHODS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
      <label className="text-xs font-medium text-slate-600 sm:col-span-2">Observações<input maxLength={5000} value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>
      <button type="submit" disabled={saving || !amount || Number(amount) <= 0 || !dueAt} className="rounded-lg bg-[#101a2b] px-3 py-2 text-xs font-semibold text-white disabled:opacity-50 sm:col-span-2">{saving ? "Salvando..." : "Registrar cobrança"}</button>
    </form>}
    {payments.length === 0 ? <p className="mt-3 text-xs text-slate-500">Nenhum lançamento financeiro cadastrado.</p> : <div className="mt-3 space-y-2">{payments.map((payment) => {
      const status = paymentStatus(payment);
      return <div key={payment.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
        <div><p className="text-sm font-semibold text-slate-900">{money(payment.amount)} · {PRODUCTS.find((item) => item.value === payment.product)?.label ?? payment.product}</p><p className="mt-1 text-xs text-slate-500">Vencimento: {new Date(payment.dueAt).toLocaleDateString("pt-BR")}{payment.method ? " · " + (PAYMENT_METHODS.find((item) => item.value === payment.method)?.label ?? payment.method) : ""}</p>{payment.notes && <p className="mt-1 text-xs text-slate-500">{payment.notes}</p>}<span className={"mt-2 inline-block rounded-full px-2 py-1 text-[11px] font-semibold " + (status === "Pago" ? "bg-emerald-50 text-emerald-700" : status === "Vencido" ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700")}>{status}</span></div>
        {payment.status !== "CANCELLED" && <button type="button" onClick={() => void onSetPaid(payment, payment.status !== "PAID")} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">{payment.status === "PAID" ? "Marcar pendente" : "Marcar como pago"}</button>}
      </div>;
    })}</div>}
  </section>;
}

export function ClientManagement({ onBack, selectedClientId }: { onBack?: () => void; selectedClientId?: string }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [inviteClientId, setInviteClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [clientQuery, setClientQuery] = useState("");
  const [accessFilter, setAccessFilter] = useState<"all" | "active" | "none">("all");
  const [clientPage, setClientPage] = useState(1);
  const [detailTab, setDetailTab] = useState<"overview" | "access" | "finance">("overview");
  const pageSize = 10;
  const [expandedClientId, setExpandedClientId] = useState<string | null>(selectedClientId ?? null);

  useEffect(() => {
    if (selectedClientId) setExpandedClientId(selectedClientId);
  }, [selectedClientId]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [clientResponse, inviteResponse, paymentResponse] = await Promise.all([
        fetch("/api/admin/clients", { cache: "no-store" }),
        fetch("/api/admin/invitations", { cache: "no-store" }),
        fetch("/api/admin/payments", { cache: "no-store" }),
      ]);
      const clientData = await clientResponse.json().catch(() => ({}));
      const inviteData = await inviteResponse.json().catch(() => ({}));
      const paymentData = await paymentResponse.json().catch(() => ({}));
      if (!clientResponse.ok || !inviteResponse.ok || !paymentResponse.ok) {
        const payload = !clientResponse.ok ? clientData : !inviteResponse.ok ? inviteData : paymentData;
        const message = payload.message;
        throw new Error(Array.isArray(message) ? message.join(" ") : message || "Não foi possível carregar a gestão de clientes.");
      }
      setClients(clientData);
      setInvitations(inviteData);
      setPayments(paymentData);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar os dados.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function createClient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), name: name.trim() || undefined, phone: phone.trim() || undefined, notes: notes.trim() || undefined }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = result.message;
        throw new Error(Array.isArray(message) ? message.join(" ") : message || "Não foi possível cadastrar o cliente.");
      }
      setNotice("Cliente cadastrado. Agora você pode configurar os produtos e enviar o convite quando quiser.");
      setEmail("");
      setName("");
      setPhone("");
      setNotes("");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível cadastrar o cliente.");
    } finally {
      setSaving(false);
    }
  }

  async function sendInvitation(client: Client) {
    const selectedProducts = [...new Set(client.productAccesses.filter((access) => access.active).map((access) => access.product))];
    if (!selectedProducts.length) {
      setError("Configure e ative pelo menos um produto na ficha do cliente antes de enviar o convite.");
      setNotice("");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    setInviteUrl("");
    try {
      const response = await fetch("/api/admin/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: client.email, name: client.name || undefined, products: selectedProducts }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = result.message;
        throw new Error(Array.isArray(message) ? message.join(" ") : message || "Não foi possível criar o convite.");
      }
      setInviteUrl(result.inviteUrl);
      setInviteClientId(client.id);
      setNotice("Convite criado. Copie o link e envie ao cliente por um canal seguro. O link expira em 7 dias.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível criar o convite.");
    } finally {
      setSaving(false);
    }
  }

  async function setClientStatus(client: Client, active: boolean) {
    if (!active && !window.confirm("Inativar a conta de " + (client.name || client.email) + "? A pessoa perderá o acesso à plataforma até ser reativada.")) return;
    setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/clients/" + encodeURIComponent(client.id) + "/status", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { const message = result.message; throw new Error(Array.isArray(message) ? message.join(" ") : message || "Não foi possível alterar o status da conta."); }
      setNotice(active ? "Conta ativada." : "Conta inativada. O cliente não poderá entrar na plataforma.");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível alterar o status da conta."); }
  }

  async function cancelInvitation(invitation: Invitation) {
    if (!window.confirm("Cancelar o convite de " + invitation.email + "? O link deixará de funcionar.")) return;
    setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/invitations/" + encodeURIComponent(invitation.id) + "/cancel", { method: "POST" });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { const message = result.message; throw new Error(Array.isArray(message) ? message.join(" ") : message || "Não foi possível cancelar o convite."); }
      setNotice("Convite cancelado. O link não poderá mais ser utilizado.");
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível cancelar o convite."); }
  }

  async function createPayment(values: { userId: string; product: Product; amount: number; dueAt: string; method: Payment["method"]; notes: string }) {
    setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(values) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { const message = result.message; throw new Error(Array.isArray(message) ? message.join(" ") : message || "Não foi possível registrar o lançamento."); }
      setNotice("Lançamento financeiro registrado."); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível registrar o lançamento."); throw cause; }
  }

  async function setPaymentPaid(payment: Payment, paid: boolean) {
    setError(""); setNotice("");
    try {
      const response = await fetch("/api/admin/payments/" + encodeURIComponent(payment.id) + "/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paid }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) { const message = result.message; throw new Error(Array.isArray(message) ? message.join(" ") : message || "Não foi possível atualizar o pagamento."); }
      setNotice(paid ? "Pagamento marcado como pago." : "Pagamento voltou para pendente."); await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível atualizar o pagamento."); }
  }
  async function updateClient(client: Client, values: { email: string; name: string; phone: string; notes: string }) {
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/admin/clients/" + encodeURIComponent(client.id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = result.message;
        throw new Error(Array.isArray(message) ? message.join(" ") : message || "Não foi possível atualizar o cadastro.");
      }
      setNotice("Dados cadastrais atualizados.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível atualizar o cadastro.");
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
    if (selectedClientId && client.id !== selectedClientId) return false;
    const matchesQuery = !normalizedQuery || [client.name ?? "", client.email].some((value) => value.toLocaleLowerCase("pt-BR").includes(normalizedQuery));
    const hasActiveAccess = client.productAccesses.some((access) => isAccessActive(access));
    const matchesAccess = accessFilter === "all" || (accessFilter === "active" ? hasActiveAccess : !hasActiveAccess);
    return matchesQuery && matchesAccess;
  });
  const pageCount = Math.max(1, Math.ceil(filteredClients.length / pageSize));
  const paginatedClients = filteredClients.slice((clientPage - 1) * pageSize, clientPage * pageSize);

  useEffect(() => { setClientPage(1); }, [clientQuery, accessFilter]);
  useEffect(() => { if (clientPage > pageCount) setClientPage(pageCount); }, [clientPage, pageCount]);

  return (
    <section className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a6792d]">Administração · Clientes</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">{selectedClientId ? "Ficha do cliente" : "Clientes e produtos"}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{selectedClientId ? "Consulte e gerencie os dados, acessos e pagamentos deste cliente." : "Crie convites e controle o acesso de cada cliente ao Grupo VIP, aulões e mentorias. A API valida as permissões no servidor."}</p>
        </div>
        <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"><RefreshCw size={15} /> Atualizar</button>
      </div>

      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{notice}</div>}

      <div className={"grid gap-5 " + (selectedClientId ? "grid-cols-1" : "xl:grid-cols-[minmax(320px,0.8fr)_minmax(0,1.2fr)]")}>
        {!selectedClientId && <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f6f0e2] text-[#9a7129]"><UserPlus size={19} /></span>
            <div><h2 className="font-semibold text-slate-900">Novo cliente</h2><p className="mt-1 text-xs text-slate-500">Cadastre primeiro; o convite pode ser enviado depois.</p></div>
          </div>
          <form onSubmit={createClient} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-slate-700">E-mail do cliente
              <input type="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-[#b58a37] focus:ring-2 focus:ring-[#d6b66f]/20" placeholder="cliente@exemplo.com" />
            </label>
            <label className="block text-sm font-medium text-slate-700">Nome <span className="font-normal text-slate-400">(opcional)</span>
              <input maxLength={100} value={name} onChange={(event) => setName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-[#b58a37] focus:ring-2 focus:ring-[#d6b66f]/20" placeholder="Nome do cliente" />
            </label>
            <label className="block text-sm font-medium text-slate-700">Telefone <span className="font-normal text-slate-400">(opcional)</span>
              <input type="tel" maxLength={40} value={phone} onChange={(event) => setPhone(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-[#b58a37] focus:ring-2 focus:ring-[#d6b66f]/20" placeholder="(00) 00000-0000" />
            </label>
            <label className="block text-sm font-medium text-slate-700">Observações <span className="font-normal text-slate-400">(opcional)</span>
              <textarea maxLength={5000} value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-[#b58a37] focus:ring-2 focus:ring-[#d6b66f]/20" placeholder="Informações importantes sobre o cliente" />
            </label>
            <button type="submit" disabled={saving} className="w-full rounded-xl bg-[#101a2b] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Cadastrando..." : "Cadastrar cliente"}</button>
          </form>

        </div>}

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          {!selectedClientId && <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-700"><Users size={19} /></span>
            <div><h2 className="font-semibold text-slate-900">Base de clientes</h2><p className="mt-1 text-xs text-slate-500">{clients.length} contas cadastradas · {clients.filter((client) => client.productAccesses.some((access) => isAccessActive(access))).length} com acesso ativo</p></div>
          </div>}
          {!selectedClientId && !loading && clients.length > 0 && <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1fr)_180px]">
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
          {loading ? <p className="py-10 text-sm text-slate-500">Carregando clientes...</p> : clients.length === 0 ? <p className="py-10 text-sm text-slate-500">Nenhum usuário cadastrado ainda.</p> : filteredClients.length === 0 ? <p className="py-10 text-sm text-slate-500">{selectedClientId ? "Cliente não encontrado ou sem permissão para visualizar a ficha." : "Nenhum cliente corresponde aos filtros selecionados."}</p> : <div className="mt-5 space-y-4">
            {paginatedClients.map((client) => {
              const expanded = expandedClientId === client.id;
              const activeAccessCount = client.productAccesses.filter((access) => isAccessActive(access)).length;
              return <article key={client.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <button type="button" aria-expanded={expanded} onClick={() => selectedClientId ? undefined : window.location.assign("/clientes/" + encodeURIComponent(client.id))} className="flex w-full flex-wrap items-center justify-between gap-3 p-4 text-left transition hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{client.name || "Sem nome"}</h3>
                      <span className={"rounded-full px-2 py-0.5 text-[10px] font-semibold " + (activeAccessCount > 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>{activeAccessCount > 0 ? `${activeAccessCount} acesso(s) ativo(s)` : "Sem acesso ativo"}</span>
                    </div>
                    <p className="mt-1 truncate text-xs text-slate-500">{client.email}</p>
                    <p className="mt-1 text-[11px] text-slate-400">Cadastro em {new Date(client.createdAt).toLocaleDateString("pt-BR")}</p><p className="mt-1 text-[11px] font-medium text-slate-500">{client.hasAccount ? (client.active ? "Conta ativa" : "Conta inativa") : invitations.some((invitation) => invitation.email.toLowerCase() === client.email.toLowerCase()) ? "Convite pendente" : "Aguardando convite"}</p>
                  </div>
                  {selectedClientId ? <span className="text-xs font-semibold text-[#9a7129]">Ficha aberta</span> : <ChevronDown size={18} className="shrink-0 text-slate-500" />}
                </button>
                {expanded && <div className="space-y-3 border-t border-slate-200 bg-slate-50/60 p-4">
                  {selectedClientId && <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
                    {([{ key: "overview", label: "Visão geral" }, { key: "access", label: "Produtos e acessos" }, { key: "finance", label: "Financeiro" }] as const).map((tab) => <button key={tab.key} type="button" onClick={() => setDetailTab(tab.key)} className={"rounded-lg px-3 py-2 text-sm font-semibold " + (detailTab === tab.key ? "bg-[#101a2b] text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100")}>{tab.label}</button>)}
                  </div>}
                  {(!selectedClientId || detailTab === "overview") && <ClientProfileEditor client={client} onSave={(values) => updateClient(client, values)} />}
                  {(!selectedClientId || detailTab === "overview") && <div className="flex flex-wrap items-center gap-2">
                    {client.hasAccount && <button type="button" onClick={() => void setClientStatus(client, !client.active)} disabled={saving} className={"rounded-lg px-3 py-2 text-xs font-semibold disabled:opacity-50 " + (client.active ? "border border-rose-200 bg-rose-50 text-rose-700" : "border border-emerald-200 bg-emerald-50 text-emerald-700")}>{client.active ? "Inativar conta" : "Ativar conta"}</button>}
                    <button type="button" onClick={() => void sendInvitation(client)} disabled={saving || client.hasAccount} className="rounded-lg bg-[#101a2b] px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{client.hasAccount ? "Conta já ativada" : invitations.some((invitation) => invitation.email.toLowerCase() === client.email.toLowerCase()) ? "Reenviar convite" : "Enviar convite"}</button>
                    {inviteUrl && inviteClientId === client.id && <button type="button" onClick={() => void copyInvite()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700"><Copy size={13} /> Copiar link</button>}
                  </div>}
                  {(!selectedClientId || detailTab === "overview") && inviteUrl && inviteClientId === client.id && <div className="rounded-lg border border-[#e7d7ad] bg-[#fcf8ed] p-3"><label className="text-xs font-semibold text-slate-800">Link de ativação<input readOnly value={inviteUrl} onFocus={(event) => event.currentTarget.select()} className="mt-2 w-full rounded-lg border border-[#e7d7ad] bg-white px-3 py-2 text-xs text-slate-700" /></label><p className="mt-2 text-xs leading-5 text-slate-500">Link de uso único, válido por 7 dias. Envie apenas ao destinatário correto.</p></div>}
                  {(!selectedClientId || detailTab === "access") && PRODUCTS.map((product) => {
                    const access = client.productAccesses.find((item) => item.product === product.value);
                    return <ProductAccessEditor key={product.value} label={product.label} access={access} onSave={(active, period, startsAt, expiresAt) => updateAccess(client, product.value, active, period, startsAt, expiresAt)} />;
                  })}
                  {(!selectedClientId || detailTab === "finance") && <ClientPayments client={client} payments={payments.filter((payment) => payment.userId === client.id)} onCreate={createPayment} onSetPaid={setPaymentPaid} />}
                </div>}
              </article>;
            })}
            {!selectedClientId && pageCount > 1 && <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
              <p className="text-xs text-slate-500">Mostrando {(clientPage - 1) * pageSize + 1}–{Math.min(clientPage * pageSize, filteredClients.length)} de {filteredClients.length} clientes</p>
              <div className="flex items-center gap-2"><button type="button" onClick={() => setClientPage((page) => Math.max(1, page - 1))} disabled={clientPage === 1} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40">Anterior</button><span className="text-xs text-slate-500">Página {clientPage} de {pageCount}</span><button type="button" onClick={() => setClientPage((page) => Math.min(pageCount, page + 1))} disabled={clientPage === pageCount} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-40">Próxima</button></div>
            </div>}
          </div>}
        </div>
      </div>

      {!selectedClientId && <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3"><ShieldCheck size={19} className="text-[#a6792d]" /><div><h2 className="font-semibold text-slate-900">Convites pendentes</h2><p className="mt-1 text-xs text-slate-500">Convites ativos ainda não utilizados.</p></div></div>
        {invitations.length === 0 ? <p className="mt-5 text-sm text-slate-500">Nenhum convite pendente.</p> : <div className="mt-4 divide-y divide-slate-100">
          {invitations.map((invitation) => <div key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div><p className="text-sm font-medium text-slate-800">{invitation.email}</p><p className="mt-1 text-xs text-slate-500">{invitation.productTypes.map((item) => PRODUCTS.find((p) => p.value === item)?.label ?? item).join(" · ")}</p></div>
            <div className="flex items-center gap-3"><p className="text-xs text-slate-500">Expira em {new Date(invitation.expiresAt).toLocaleDateString("pt-BR")}</p><button type="button" onClick={() => void cancelInvitation(invitation)} disabled={saving} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50">Cancelar convite</button></div>
          </div>)}
        </div>}
      </div>}
      {!selectedClientId && <button onClick={() => onBack?.()} className="text-sm font-semibold text-slate-600 hover:text-slate-900">← Voltar ao painel</button>}
      {selectedClientId && <button onClick={() => window.location.assign("/#clientes-admin")} className="text-sm font-semibold text-slate-600 hover:text-slate-900">← Voltar à lista de clientes</button>}
    </section>
  );
}
