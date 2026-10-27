"use client";

import { PageHeader } from "@/components/page-header";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Clock3 } from "lucide-react";

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
  const [searchTerm, setSearchTerm] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState("10");
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [paymentSaving, setPaymentSaving] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDueAt, setPaymentDueAt] = useState("");
  const [paymentProduct, setPaymentProduct] = useState<Payment["product"]>("GROUP_VIP");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);


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

  function beginEditPayment(payment: Payment) {
    setEditingPayment(payment);
    setPaymentAmount(String(payment.amount));
    setPaymentDueAt(new Date(payment.dueAt).toISOString().slice(0, 10));
    setPaymentProduct(payment.product);
    setPaymentMethod(payment.method ?? "");
    setPaymentNotes(payment.notes ?? "");
  }

  async function savePaymentEdit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingPayment) return;
    setPaymentSaving(true);
    try {
      const response = await fetch(`/api/admin/payments/${encodeURIComponent(editingPayment.id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: editingPayment.userId,
          product: paymentProduct,
          amount: Number(paymentAmount),
          dueAt: new Date(paymentDueAt + "T12:00:00").toISOString(),
          method: paymentMethod || undefined,
          notes: paymentNotes.trim() || undefined,
        }),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = Array.isArray(payload.message) ? payload.message.join(" ") : payload.message;
        throw new Error(message || "Não foi possível atualizar o lançamento.");
      }
      setEditingPayment(null);
      setToast({ type: "success", message: "Lançamento atualizado com sucesso." });
      await load();
    } catch (cause) {
      setToast({ type: "error", message: cause instanceof Error ? cause.message : "Não foi possível atualizar o lançamento." });
    } finally {
      setPaymentSaving(false);
    }
  }

  async function deletePayment(payment: Payment) {
    if (!window.confirm(`Excluir o lançamento de ${payment.user?.name || payment.user?.email || "cliente"}? Esta ação não pode ser desfeita.`)) return;
    try {
      const response = await fetch(`/api/admin/payments/${encodeURIComponent(payment.id)}`, { method: "DELETE" });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = Array.isArray(payload.message) ? payload.message.join(" ") : payload.message;
        throw new Error(message || "Não foi possível excluir o lançamento.");
      }
      setPayments((current) => current.filter((item) => item.id !== payment.id));
      setToast({ type: "success", message: "Lançamento excluído com sucesso." });
    } catch (cause) {
      setToast({ type: "error", message: cause instanceof Error ? cause.message : "Não foi possível excluir o lançamento." });
    }
  }



  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [toast]);



  const filtered = useMemo(() => payments.filter((payment) => {
    const dateForPeriod = payment.status === "PAID" ? payment.paidAt : payment.dueAt;
    const matchesPeriod = withinPeriod(dateForPeriod, period);
    const status = payment.status === "CANCELLED" ? "cancelled" : payment.status === "PAID" ? "paid" : isOverdue(payment) ? "overdue" : "pending";
    const term = searchTerm.trim().toLocaleLowerCase("pt-BR");
    const matchesSearch = !term || [payment.user?.name, payment.user?.email, products[payment.product], String(payment.amount)].some((value) => String(value ?? "").toLocaleLowerCase("pt-BR").includes(term));
    const matchesProduct = productFilter === "all" || payment.product === productFilter;
    return matchesPeriod && (statusFilter === "all" || statusFilter === status) && matchesProduct && matchesSearch;
  }), [payments, period, statusFilter, productFilter, searchTerm]);

  const pageSizeNumber = Number(pageSize);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSizeNumber));
  const paginatedPayments = filtered.slice((page - 1) * pageSizeNumber, page * pageSizeNumber);

  useEffect(() => { setPage(1); }, [period, statusFilter, productFilter, searchTerm, pageSize]);

  useEffect(() => { if (page > pageCount) setPage(pageCount); }, [page, pageCount]);

  const received = filtered.reduce((sum, payment) => sum + (payment.status === "PAID" ? Number(payment.amount) : 0), 0);
  const pending = filtered.reduce((sum, payment) => sum + (payment.status === "PENDING" && !isOverdue(payment) ? Number(payment.amount) : 0), 0);
  const overdue = filtered.reduce((sum, payment) => sum + (isOverdue(payment) ? Number(payment.amount) : 0), 0);

  return <section className="space-y-6">
    {toast && <div role={toast.type === "error" ? "alert" : "status"} aria-live={toast.type === "error" ? "assertive" : "polite"} className={`fixed right-5 top-5 z-[100] max-w-[min(420px,calc(100vw-2.5rem))] rounded-xl border px-4 py-3 text-sm font-medium shadow-xl ${toast.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900"}`}>{toast.message}<button type="button" onClick={() => setToast(null)} aria-label="Fechar aviso" className="ml-4 font-bold">×</button></div>}
    <PageHeader eyebrow="CONTROLE DE RECEBIMENTOS" title="Financeiro" description="Acompanhe cobranças, recebimentos e valores vencidos a partir dos lançamentos registrados." />
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
        <div className="flex flex-wrap items-center gap-3">
          <input aria-label="Buscar lançamentos" placeholder="Buscar cliente, e-mail ou valor" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm sm:w-56" />
          <label className="text-sm text-slate-600">Produto{" "}
            <select value={productFilter} onChange={(event) => setProductFilter(event.target.value)} className="ml-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <option value="all">Todos</option><option value="GROUP_VIP">Grupo VIP</option><option value="AULAO">Aulões</option><option value="MENTORSHIP">Mentorias</option>
            </select>
          </label>
          <label className="text-sm text-slate-600">Situação{" "}
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="ml-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <option value="all">Todas</option><option value="paid">Pagos</option><option value="pending">Pendentes</option><option value="overdue">Vencidos</option><option value="cancelled">Cancelados</option>
            </select>
          </label>
        </div>
      </div>
      {editingPayment && <form onSubmit={savePaymentEdit} className="mt-5 grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2 xl:grid-cols-3">
        <div className="sm:col-span-2 xl:col-span-3"><h3 className="font-semibold text-slate-900">Editar lançamento · {editingPayment.user?.name || editingPayment.user?.email || "Cliente"}</h3></div>
        <label className="text-xs font-medium text-slate-600">Produto<select value={paymentProduct} onChange={(e) => setPaymentProduct(e.target.value as Payment["product"])} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option value="GROUP_VIP">Grupo VIP</option><option value="AULAO">Aulões</option><option value="MENTORSHIP">Mentorias</option></select></label>
        <label className="text-xs font-medium text-slate-600">Valor (R$)<input required type="number" min="0.01" step="0.01" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /></label>
        <label className="text-xs font-medium text-slate-600">Vencimento<input required type="date" value={paymentDueAt} onChange={(e) => setPaymentDueAt(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" /></label>
        <label className="text-xs font-medium text-slate-600">Forma de pagamento<select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"><option value="">Não definida</option><option value="PIX">Pix</option><option value="BANK_TRANSFER">Transferência</option><option value="CREDIT_CARD">Cartão de crédito</option><option value="CASH">Dinheiro</option><option value="OTHER">Outro</option></select></label>
        <label className="text-xs font-medium text-slate-600 sm:col-span-2">Observações<textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm" rows={2} /></label>
        <div className="flex gap-2 sm:col-span-2 xl:col-span-3"><button type="submit" disabled={paymentSaving} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{paymentSaving ? "Salvando…" : "Salvar alterações"}</button><button type="button" onClick={() => setEditingPayment(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Cancelar</button></div>
      </form>}
      {loading ? <p className="py-10 text-sm text-slate-500">Carregando lançamentos financeiros…</p> : filtered.length === 0 ? <p className="py-10 text-sm text-slate-500">Nenhum lançamento encontrado para os filtros selecionados.</p> : <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm">
        <thead><tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500"><th className="px-3 py-3 font-semibold">Cliente</th><th className="px-3 py-3 font-semibold">Produto</th><th className="px-3 py-3 font-semibold">Vencimento</th><th className="px-3 py-3 font-semibold">Valor</th><th className="px-3 py-3 font-semibold">Situação</th><th className="px-3 py-3 font-semibold">Ações</th></tr></thead>
        <tbody>{paginatedPayments.map((payment) => {
          const overdueStatus = isOverdue(payment);
          const label = payment.status === "PAID" ? "Pago" : payment.status === "CANCELLED" ? "Cancelado" : overdueStatus ? "Vencido" : "Pendente";
          return <tr key={payment.id} className="border-b border-slate-100 last:border-0">
            <td className="px-3 py-3"><p className="font-medium text-slate-900">{payment.user?.name || "Sem nome"}</p><p className="mt-1 text-xs text-slate-500">{payment.user?.email || "—"}</p></td>
            <td className="px-3 py-3 text-slate-600">{products[payment.product]}</td><td className="px-3 py-3 text-slate-600">{dateLabel(payment.dueAt)}</td><td className="px-3 py-3 font-semibold text-slate-900">{money(Number(payment.amount))}</td>
            <td className="px-3 py-3"><span className={"inline-flex rounded-full px-2.5 py-1 text-xs font-semibold " + (label === "Pago" ? "bg-emerald-50 text-emerald-700" : label === "Vencido" ? "bg-rose-50 text-rose-700" : label === "Cancelado" ? "bg-slate-100 text-slate-500" : "bg-amber-50 text-amber-700")}>{label}</span></td>
            <td className="px-3 py-3"><div className="flex flex-wrap gap-2">{payment.status !== "CANCELLED" && <button type="button" onClick={async () => { const response = await fetch("/api/admin/payments/" + encodeURIComponent(payment.id) + "/status", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ paid: payment.status !== "PAID" }) }); if (!response.ok) { setToast({ type: "error", message: "Não foi possível atualizar o pagamento." }); return; } setToast({ type: "success", message: payment.status === "PAID" ? "Lançamento marcado como pendente." : "Pagamento marcado como pago." }); await load(); }} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">{payment.status === "PAID" ? "Marcar pendente" : "Marcar pago"}</button>}<button type="button" onClick={() => beginEditPayment(payment)} className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700">Editar</button><button type="button" onClick={() => void deletePayment(payment)} className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700">Excluir</button></div></td>
          </tr>;
        })}</tbody>
      </table></div>}
      {!loading && filtered.length > 0 && <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>Exibindo {Math.min((page - 1) * pageSizeNumber + 1, filtered.length)}–{Math.min(page * pageSizeNumber, filtered.length)} de {filtered.length}</span>
          <label className="ml-2">Por página{" "}
            <select value={pageSize} onChange={(event) => setPageSize(event.target.value)} className="rounded-lg border border-slate-200 bg-white px-2 py-1.5">
              <option value="10">10</option><option value="25">25</option><option value="50">50</option>
            </select>
          </label>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Anterior</button>
          <span className="text-sm text-slate-600">Página {page} de {pageCount}</span>
          <button type="button" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))} className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">Próxima</button>
        </div>
      </div>}
    </div>
  </section>;
}
