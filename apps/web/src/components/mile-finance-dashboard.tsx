"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowDownLeft, Boxes, LoaderCircle, Plus, ShoppingCart, TrendingUp, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Program = { id: string; name: string; code: string; type: string };
type Inventory = { id: string; miles: number; totalCost: string | number; averageCpm: string | number; loyaltyProgram: Program };
type Purchase = { id: string; miles: number; grossAmount: string | number; fees: string | number; acquisitionCpm: string | number; purchasedAt: string; loyaltyProgram: Program; notes?: string | null };
type Sale = { id: string; miles: number; buyerName?: string | null; grossAmount: string | number; fees: string | number; costOfGoodsSold: string | number | null; acquisitionCpm: string | number; soldAt: string; loyaltyProgram: Program; notes?: string | null };
type PageResult<T> = { items: T[]; total: number; page: number; pageSize: number; totalPages: number };
type DashboardData = { walletBalances: Array<{ loyaltyProgramId: string; miles: number }>; hasSalesWithUnknownCost?: boolean; purchases: { count: number; grossAmount: string | number; fees: string | number; miles: number }; sales: { count: number; grossAmount: string | number; fees: string | number; miles: number }; estimatedProfit: string | number; inventory: Inventory[]; inventoryTotalCost: string | number; inventoryMiles: number };

const money = (value: string | number | null | undefined) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value ?? 0));
const integer = (value: number) => new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(value);
const date = (value: string) => new Intl.DateTimeFormat("pt-BR").format(new Date(value));

export function MileFinanceDashboard() {
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [movements, setMovements] = useState<Array<{ id: string; type: string; miles: number; totalCost: string | number; occurredAt: string; loyaltyProgram: Program; reason?: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [formType, setFormType] = useState<"purchase" | "sale" | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [purchasePage, setPurchasePage] = useState(1);
  const [salePage, setSalePage] = useState(1);
  const [movementPage, setMovementPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterProgramId, setFilterProgramId] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const [movementType, setMovementType] = useState("");
  const [purchaseMeta, setPurchaseMeta] = useState({ total: 0, totalPages: 0 });
  const [saleMeta, setSaleMeta] = useState({ total: 0, totalPages: 0 });
  const [movementMeta, setMovementMeta] = useState({ total: 0, totalPages: 0 });
  const [programId, setProgramId] = useState("");
  const [miles, setMiles] = useState("");
  const [grossAmount, setGrossAmount] = useState("");
  const [fees, setFees] = useState("0");
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 10));
  const [buyerName, setBuyerName] = useState("");
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [dashboardResponse, programResponse, purchaseResponse, saleResponse, movementResponse] = await Promise.all([
        fetch("/api/mile-finance/dashboard", { cache: "no-store" }),
        fetch("/api/loyalty-programs", { cache: "no-store" }),
        fetch(`/api/mile-finance/purchases?page=${purchasePage}&pageSize=${pageSize}${filterProgramId ? `&loyaltyProgramId=${filterProgramId}` : ""}${filterFrom ? `&from=${filterFrom}` : ""}${filterTo ? `&to=${filterTo}` : ""}`, { cache: "no-store" }),
        fetch(`/api/mile-finance/sales?page=${salePage}&pageSize=${pageSize}${filterProgramId ? `&loyaltyProgramId=${filterProgramId}` : ""}${filterFrom ? `&from=${filterFrom}` : ""}${filterTo ? `&to=${filterTo}` : ""}`, { cache: "no-store" }),
        fetch(`/api/mile-finance/movements?page=${movementPage}&pageSize=${Math.max(20, pageSize)}${filterProgramId ? `&loyaltyProgramId=${filterProgramId}` : ""}${filterFrom ? `&from=${filterFrom}` : ""}${filterTo ? `&to=${filterTo}` : ""}${movementType ? `&type=${movementType}` : ""}`, { cache: "no-store" }),
      ]);
      const responses = [dashboardResponse, programResponse, purchaseResponse, saleResponse, movementResponse];
      const payloads = await Promise.all(responses.map((response) => response.json().catch(() => ({}))));
      const failedIndex = responses.findIndex((response) => !response.ok);
      if (failedIndex >= 0) {
        const payload = payloads[failedIndex] as { message?: string | string[] };
        throw new Error(Array.isArray(payload.message) ? payload.message.join(" ") : payload.message || "Não foi possível carregar o financeiro de milhas.");
      }
      setDashboard(payloads[0] as DashboardData);
      setPrograms(payloads[1] as Program[]);
      const purchaseResult = payloads[2] as PageResult<Purchase>;
      const saleResult = payloads[3] as PageResult<Sale>;
      const movementResult = payloads[4] as PageResult<(typeof movements)[number]>;
      setPurchases(purchaseResult.items);
      setSales(saleResult.items);
      setMovements(movementResult.items);
      setPurchaseMeta({ total: purchaseResult.total, totalPages: purchaseResult.totalPages });
      setSaleMeta({ total: saleResult.total, totalPages: saleResult.totalPages });
      setMovementMeta({ total: movementResult.total, totalPages: movementResult.totalPages });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível carregar o financeiro de milhas.");
    } finally {
      setLoading(false);
    }
  }, [purchasePage, salePage, movementPage, pageSize, filterProgramId, filterFrom, filterTo, movementType]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const selectedInventory = useMemo(() => dashboard?.inventory.find((item) => item.loyaltyProgram.id === programId), [dashboard, programId]);
  const selectedWalletBalance = useMemo(() => dashboard?.walletBalances.find((item) => item.loyaltyProgramId === programId)?.miles ?? 0, [dashboard, programId]);
  const availableForSale = selectedInventory?.miles ? selectedInventory.miles : selectedWalletBalance;

  function openForm(type: "purchase" | "sale") {
    setEditingId(null);
    setFormType(type);
    setProgramId(programId || programs[0]?.id || "");
    setMiles("");
    setGrossAmount("");
    setFees("0");
    setOccurredAt(new Date().toISOString().slice(0, 10));
    setBuyerName("");
    setNotes("");
    setError("");
  }

  function openEdit(type: "purchase" | "sale", item: Purchase | Sale) {
    setFormType(type);
    setEditingId(item.id);
    setProgramId(item.loyaltyProgram?.id ?? "");
    setMiles(String(item.miles));
    setGrossAmount(String(Number(item.grossAmount)));
    setFees(String(Number(item.fees)));
    setOccurredAt(new Date(type === "purchase" ? (item as Purchase).purchasedAt : (item as Sale).soldAt).toISOString().slice(0, 10));
    setBuyerName(type === "sale" ? (item as Sale).buyerName ?? "" : "");
    setNotes(item.notes ?? "");
    setError("");
  }

  async function removeOperation(type: "purchase" | "sale", item: Purchase | Sale) {
    if (!window.confirm("Confirma excluir esta operação? O sistema tentará reverter estoque e saldo.")) return;
    setSaving(true);
    try {
      const response = await fetch(`/api/mile-finance/${type === "purchase" ? "purchases" : "sales"}/${item.id}`, { method: "DELETE" });
      const result = await response.json().catch(() => ({})) as { message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(result.message) ? result.message.join(" ") : result.message || "Não foi possível excluir a operação.");
      setToast({ type: "success", message: "Operação excluída e saldos atualizados." });
      await load();
    } catch (cause) {
      setToast({ type: "error", message: cause instanceof Error ? cause.message : "Não foi possível excluir a operação." });
    } finally { setSaving(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!formType) return;
    setSaving(true);
    try {
      const payload = {
        loyaltyProgramId: programId,
        miles: Number(miles),
        grossAmount: Number(grossAmount),
        fees: Number(fees || 0),
        ...(formType === "purchase" ? { purchasedAt: new Date(occurredAt + "T12:00:00").toISOString() } : { soldAt: new Date(occurredAt + "T12:00:00").toISOString(), buyerName }),
        notes: notes.trim() || undefined,
      };
      const response = await fetch(`/api/mile-finance/${formType === "purchase" ? "purchases" : "sales"}${editingId ? `/${editingId}` : ""}`, {
        method: editingId ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({})) as { message?: string | string[] };
      if (!response.ok) throw new Error(Array.isArray(result.message) ? result.message.join(" ") : result.message || "Não foi possível registrar a operação.");
      setFormType(null);
      setEditingId(null);
      setPurchasePage(1); setSalePage(1); setMovementPage(1);
      setToast({ type: "success", message: editingId ? "Operação atualizada com sucesso." : formType === "purchase" ? "Compra registrada e estoque atualizado." : "Venda registrada e estoque atualizado." });
      await load();
    } catch (cause) {
      setToast({ type: "error", message: cause instanceof Error ? cause.message : "Não foi possível registrar a operação." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="space-y-6">
      {toast && <div role={toast.type === "error" ? "alert" : "status"} aria-live={toast.type === "error" ? "assertive" : "polite"} className={`fixed right-5 top-5 z-[100] max-w-[min(420px,calc(100vw-2.5rem))] rounded-xl border px-4 py-3 text-sm font-medium shadow-xl ${toast.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900"}`}>{toast.message}<button type="button" onClick={() => setToast(null)} aria-label="Fechar aviso" className="ml-4 font-bold">×</button></div>}
      <div className="welcome-row">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" />GESTÃO DE OPERAÇÕES</div>
          <h1 className="page-title">Financeiro de Milhas<span className="gold-period">.</span></h1>
          <p className="page-subtitle">Compras, vendas, estoque e resultado por programa — separado do financeiro administrativo.</p>
        </div>
        <div className="welcome-actions">
          <Button variant="outline" className="!border-slate-200 !bg-white !text-[#142137] hover:!bg-slate-50" onClick={() => openForm("purchase")}><Plus size={15} className="mr-2" />Registrar compra</Button>
          <Button onClick={() => openForm("sale")}><Plus size={15} className="mr-2" />Registrar venda</Button>
        </div>
      </div>
      {error && <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><span>{error}</span><Button variant="outline" onClick={() => void load()}>Tentar novamente</Button></div>}
      {formType && <Card className="panel p-5"><form onSubmit={submit} className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="md:col-span-2 xl:col-span-3"><h2 className="text-lg font-semibold">{editingId ? "Editar operação" : formType === "purchase" ? "Registrar compra de milhas" : "Registrar venda de milhas"}</h2><p className="text-sm text-slate-500">{formType === "sale" ? `Saldo disponível neste programa: ${integer(availableForSale)} milhas${!selectedInventory?.miles && selectedWalletBalance > 0 ? " (custo de aquisição não apurado)" : ""}` : "O custo médio será atualizado automaticamente após a compra."}</p></div>
        <label className="text-sm font-medium">Programa<select required disabled={!!editingId} value={programId} onChange={(e) => setProgramId(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2"><option value="">Selecione um programa</option>{programs.map((program) => <option key={program.id} value={program.id}>{program.name}</option>)}</select></label>
        <label className="text-sm font-medium">Quantidade de milhas<input required disabled={!!editingId} type="number" min="1" step="1" value={miles} onChange={(e) => setMiles(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
        <label className="text-sm font-medium">Valor bruto (R$)<input required type="number" min="0.01" step="0.01" value={grossAmount} onChange={(e) => setGrossAmount(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
        <label className="text-sm font-medium">Taxas (R$)<input required type="number" min="0" step="0.01" value={fees} onChange={(e) => setFees(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
        {formType === "sale" && <label className="text-sm font-medium">Comprador (opcional)<input value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2" /></label>}
        <label className="text-sm font-medium">Data<input required type="date" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
        <label className="text-sm font-medium md:col-span-2">Observações<textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 px-3 py-2" /></label>
        <div className="flex gap-2 md:col-span-2 xl:col-span-3"><Button type="submit" disabled={saving || !programId}>{saving ? <><LoaderCircle className="mr-2 animate-spin" size={15} />Salvando…</> : editingId ? "Salvar alterações" : "Salvar operação"}</Button><Button type="button" variant="outline" onClick={() => { setFormType(null); setEditingId(null); }} disabled={saving}>Cancelar</Button></div>
      </form></Card>}
      {loading && !dashboard ? <Card className="p-10 text-center text-slate-500"><LoaderCircle className="mx-auto mb-2 animate-spin" />Carregando financeiro de milhas…</Card> : dashboard && <>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="panel p-5"><div className="text-sm text-slate-500">Compras no período</div><div className="mt-2 text-2xl font-semibold">{money(dashboard.purchases.grossAmount)} </div><div className="mt-1 text-xs text-slate-500">{integer(dashboard.purchases.miles)} milhas adquiridas</div></Card>
          <Card className="panel p-5"><div className="text-sm text-slate-500">Vendas concluídas</div><div className="mt-2 text-2xl font-semibold">{money(dashboard.sales.grossAmount)}</div><div className="mt-1 text-xs text-slate-500">{integer(dashboard.sales.miles)} milhas vendidas</div></Card>
          <Card className="panel p-5"><div className="text-sm text-slate-500">Custo do estoque</div><div className="mt-2 text-2xl font-semibold">{money(dashboard.inventoryTotalCost)}</div><div className="mt-1 text-xs text-slate-500">{integer(dashboard.inventoryMiles)} milhas disponíveis</div></Card>
          <Card className="panel p-5"><div className="text-sm text-slate-500">Lucro estimado das vendas</div><div className="mt-2 text-2xl font-semibold text-emerald-700">{money(dashboard.estimatedProfit)}</div><div className="mt-1 text-xs text-slate-500">{dashboard.hasSalesWithUnknownCost ? "Lucro considera apenas vendas com custo conhecido" : "Após taxas e custo das milhas vendidas"}</div></Card>
        </div>
        <Card className="panel p-5"><div className="mb-4 flex items-center gap-2"><Boxes size={18} /><h2 className="text-lg font-semibold">Estoque por programa</h2></div>
          {dashboard.inventory.length ? <div className="overflow-x-auto"><table className="w-full min-w-[650px] text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="px-3 py-3">Programa</th><th className="px-3 py-3">Saldo</th><th className="px-3 py-3">Custo médio / milheiro</th><th className="px-3 py-3">Custo total</th></tr></thead><tbody>{dashboard.inventory.map((item) => <tr key={item.id} className="border-b last:border-0"><td className="px-3 py-3 font-medium">{item.loyaltyProgram.name}</td><td className="px-3 py-3">{integer(item.miles)}</td><td className="px-3 py-3">{money(item.averageCpm)}</td><td className="px-3 py-3">{money(item.totalCost)}</td></tr>)}</tbody></table></div> : <p className="py-6 text-center text-sm text-slate-500">Nenhum estoque registrado. Cadastre uma compra para começar.</p>}
        </Card>
        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="panel p-5"><div className="mb-4 flex items-center gap-2"><ShoppingCart size={18} /><h2 className="text-lg font-semibold">Compras recentes</h2></div>
            {purchases.length ? <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="px-2 py-3">Data</th><th className="px-2 py-3">Programa</th><th className="px-2 py-3">Milhas</th><th className="px-2 py-3">Custo total</th><th className="px-2 py-3">Ações</th></tr></thead><tbody>{purchases.slice(0,8).map((item) => <tr key={item.id} className="border-b last:border-0"><td className="px-2 py-3">{date(item.purchasedAt)}</td><td className="px-2 py-3">{item.loyaltyProgram.name}</td><td className="px-2 py-3">{integer(item.miles)}</td><td className="px-2 py-3">{money(Number(item.grossAmount) + Number(item.fees))}</td><td className="px-2 py-3"><div className="flex gap-2"><Button variant="outline" size="sm" disabled={saving} onClick={() => openEdit("purchase", item)}><Pencil size={13} className="mr-1"/>Editar</Button><Button variant="outline" size="sm" disabled={saving} className="!border-rose-200 !text-rose-700 hover:!bg-rose-50" onClick={() => void removeOperation("purchase", item)}><Trash2 size={13} className="mr-1"/>Excluir</Button></div></td></tr>)}</tbody></table></div> : <p className="py-6 text-center text-sm text-slate-500">Nenhuma compra registrada.</p>}
          </Card>
          <Card className="panel p-5"><div className="mb-4 flex items-center gap-2"><TrendingUp size={18} /><h2 className="text-lg font-semibold">Vendas recentes</h2></div>
            {sales.length ? <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="px-2 py-3">Data</th><th className="px-2 py-3">Programa</th><th className="px-2 py-3">Milhas</th><th className="px-2 py-3">Receita líquida</th><th className="px-2 py-3">Lucro</th><th className="px-2 py-3">Ações</th></tr></thead><tbody>{sales.slice(0,8).map((item) => <tr key={item.id} className="border-b last:border-0"><td className="px-2 py-3">{date(item.soldAt)}</td><td className="px-2 py-3">{item.loyaltyProgram?.name ?? "Programa não disponível"}</td><td className="px-2 py-3">{integer(item.miles)}</td><td className="px-2 py-3">{money(Number(item.grossAmount) - Number(item.fees))}</td><td className="px-2 py-3 font-semibold text-emerald-700">{item.costOfGoodsSold == null ? "Custo não apurado" : money(Number(item.grossAmount) - Number(item.fees) - Number(item.costOfGoodsSold))}</td><td className="px-2 py-3"><div className="flex gap-2"><Button variant="outline" size="sm" disabled={saving} onClick={() => openEdit("sale", item)}><Pencil size={13} className="mr-1"/>Editar</Button><Button variant="outline" size="sm" disabled={saving} className="!border-rose-200 !text-rose-700 hover:!bg-rose-50" onClick={() => void removeOperation("sale", item)}><Trash2 size={13} className="mr-1"/>Excluir</Button></div></td></tr>)}</tbody></table></div> : <p className="py-6 text-center text-sm text-slate-500">Nenhuma venda registrada.</p>}
          </Card>
        </div>
        <Card className="panel p-5"><div className="mb-4 flex items-center gap-2"><ArrowDownLeft size={18} /><h2 className="text-lg font-semibold">Histórico de movimentações</h2></div>
          {movements.length ? <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead><tr className="border-b text-slate-500"><th className="px-3 py-3">Data</th><th className="px-3 py-3">Tipo</th><th className="px-3 py-3">Programa</th><th className="px-3 py-3">Milhas</th><th className="px-3 py-3">Custo</th></tr></thead><tbody>{movements.slice(0,12).map((item) => <tr key={item.id} className="border-b last:border-0"><td className="px-3 py-3">{date(item.occurredAt)}</td><td className="px-3 py-3">{item.type === "PURCHASE" ? "Compra" : item.type === "SALE" ? "Venda" : item.type === "ADJUSTMENT_IN" ? "Ajuste de entrada" : "Ajuste de saída"}</td><td className="px-3 py-3">{item.loyaltyProgram.name}</td><td className="px-3 py-3">{integer(item.miles)}</td><td className="px-3 py-3">{money(item.totalCost)}</td></tr>)}</tbody></table></div> : <p className="py-6 text-center text-sm text-slate-500">As movimentações aparecerão após registrar compras e vendas.</p>}
        </Card>
      </>}
    </section>
  );
}
