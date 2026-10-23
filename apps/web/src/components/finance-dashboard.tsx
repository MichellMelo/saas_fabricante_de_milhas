"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3, RefreshCw, Wallet } from "lucide-react";

type Payment = {
  id: string;
  userId: string;
  product: "GROUP_VIP" | "AULAO" | "MENTORSHIP";
  amount: string | number;
  dueAt: string;
  status: "PENDING" | "PAID" | "CANCELLED";
  method: string | null;
  paidAt: string | null;
  notes: string | null;
  createdAt: string;
  user?: { id: string; name: string | null; email: string };
};

const products: Record<Payment["product"], string> = {
  GROUP_VIP: "Grupo VIP",
  AULAO: "Aulões",
  MENTORSHIP: "Mentorias",
};

const money = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const dateLabel = (value: string) =>
  new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" });

function isOverdue(payment: Payment) {
  return payment.status === "PENDING" && new Date(payment.dueAt).getTime() < new Date().setHours(0, 0, 0, 0);
}

function withinPeriod(value: string | null, period: string) {
  if (!value || period === "all") return true;
  const date = new Date(value);
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  if (period === "30") start.setDate(start.getDate() - 29);
  if (period === "90") start.setDate(start.getDate() - 89);
  if (period === "month") start.setDate(1);
  return date >= start && date <= now;
}

export function FinanceDashboard() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState("30");
  const [statusFilter, setStatusFilter] = useState("all");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/admin/payments", { cache: "no-store" });
      const payload = await response.json().catch(() => []);
      if (!response.ok) throw new Error(payload.message || "Não foi possível carregar os lançamentos financeiros.");
      if (!Array.isArray(payload)) throw new Error("A resposta financeira veio em um formato inesperado.");
      setPayments(payload);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Falha ao carregar os dados financeiros.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  const filtered = useMemo(() => payments.filter((payment) => {
    const dateForPeriod = payment.status === "PAID" ? payment.paidAt : payment.dueAt;
    const matchesPeriod = withinPeriod(dateForPeriod, period);
    const status = payment.status === "CANCELLED" ? "cancelled" : payment.status === "PAID" ? "paid" : isOverdue(payment) ? "overdue" : "pending";
    return matchesPeriod && (statusFilter === "all" || statusFilter === status);
  }), [payments, period, statusFilter]);

  const received = filtered.reduce((sum, payment) => sum + (payment.status === "PAID" ? Number(payment.amount) : 0), 0);
  const pending = filtered.reduce((sum, payment) => sum + (payment.status === "PENDING" && !isOverdue(payment) ? Number(payment.amount) : 0), 0);
  const overdue = filtered.reduce((sum, payment) => sum + (isOverdue(payment) ? Number(payment.amount) : 0), 0);

  return <section className="space-y-6">
    <div className="module-welcome-row flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a6792d]">Controle de recebimentos</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">Financeiro</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">Acompanhe cobranças, recebimentos e valores vencidos a partir dos lançamentos registrados.</p>
      </div>
      <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"><RefreshCw size={15} /> Atualizar</button>
    </div>
    {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-slate-500">O período considera a data de pagamento para recebidos e o vencimento para cobranças em aberto.</p>
      <label className="text-sm text-slate-600">Período{" "}
        <select value={period} onChange={(event) => setPeriod(event.target.value)} className="ml-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
          <option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="month">Este mês</option><option value="all">Todo o período</option>
        </select>
      </label>
    </div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-600">Recebido</p><span className="rounded-xl bg-emerald-50 p-2 text-emerald-700"><CheckCircle2 size={19}/></span></div>
        <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{money(received)}</p><p className="mt-1 text-xs text-slate-500">Pagamentos marcados como pagos</p>
      </article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-600">A receber</p><span className="rounded-xl bg-amber-50 p-2 text-amber-700"><Clock3 size={19}/></span></div>
        <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{money(pending)}</p><p className="mt-1 text-xs text-slate-500">Cobranças pendentes ainda no prazo</p>
      </article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between"><p className="text-sm font-medium text-slate-600">Em atraso</p><span className="rounded-xl bg-rose-50 p-2 text-rose-700"><AlertCircle size={19}/></span></div>
        <p className="mt-4 text-2xl font-semibold tracking-tight text-slate-900">{money(overdue)}</p><p className="mt-1 text-xs text-slate-500">Cobranças pendentes após o vencimento</p>
      </article>
    </div>
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="font-semibold text-slate-900">Lançamentos financeiros</h2><p className="mt-1 text-xs text-slate-500">{loading ? "Atualizando dados…" : `${filtered.length} lançamento(s) no filtro`}</p></div>
        <label className="text-sm text-slate-600">Situação{" "}
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="ml-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
            <option value="all">Todas</option><option value="paid">Pagos</option><option value="pending">Pendentes</option><option value="overdue">Vencidos</option><option value="cancelled">Cancelados</option>
          </select>
        </label>
      </div>
      {loading ? <p className="py-10 text-sm text-slate-500">Carregando lançamentos financeiros…</p> : filtered.length === 0 ? <p className="py-10 text-sm text-slate-500">Nenhum lançamento encontrado para os filtros selecionados.</p> : <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm">
        <thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><th className="px-3 py-3 font-semibold">Cliente</th><th className="px-3 py-3 font-semibold">Produto</th><th className="px-3 py-3 font-semibold">Vencimento</th><th className="px-3 py-3 font-semibold">Valor</th><th className="px-3 py-3 font-semibold">Situação</th><th className="px-3 py-3 font-semibold">Ação</th></tr></thead>
        <tbody>{filtered.map((payment) => {
          const overdueStatus = isOverdue(payment);
          const label = payment.status === "PAID" ? "Pago" : payment.status === "CANCELLED" ? "Cancelado" : overdueStatus ? "Vencido" : "Pendente";
          return <tr key={payment.id} className="border-b border-slate-100 last:border-0">
            <td className="px-3 py-3"><p className="font-medium text-slate-900">{payment.user?.name || "Sem nome"}</p><p className="mt-1 text-xs text-slate-500">{payment.user?.email || "—"}</p></td>
            <td className="px-3 py-3 text-slate-600">{products[payment.product]}</td><td className="px-3 py-3 text-slate-600">{dateLabel(payment.dueAt)}</td><td className="px-3 py-3 font-semibold text-slate-900">{money(Number(payment.amount))}</td>
            <td className="px-3 py-3"><span className={"inline-flex rounded-full px-2.5 py-1 text-xs font-semibold " + (label === "Pago" ? "bg-emerald-50 text-emerald-700" : label === "Vencido" ? "bg-rose-50 text-rose-700" : label === "Cancelado" ? "bg-slate-100 text-slate-500" : "bg-amber-50 text-amber-700")}>{label}</span></td>
            <td className="px-3 py-3">{payment.status !== "CANCELLED" && <button type="button" onClick={async () => { const response = await fetch("/api/admin/payments/" + encodeURIComponent(payment.id) + "/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paid: payment.status !== "PAID" }) }); if (!response.ok) { setError("Não foi possível atualizar o pagamento."); return; } await load(); }} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">{payment.status === "PAID" ? "Marcar pendente" : "Marcar pago"}</button>}</td>
          </tr>;
        })}</tbody>
      </table></div>}
    </div>
  </section>;
}
