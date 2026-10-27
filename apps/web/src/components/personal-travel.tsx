"use client";

import { PageHeader } from "@/components/page-header";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, Coins, Plane, Plus, RefreshCw, Search, Trash2, Undo2, Wallet, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Passenger = { id: string; name: string };
type Trip = {
  id: string; title: string | null; origin: string; destination: string;
  outboundDate: string; returnDate: string | null; notes: string | null;
  passengers: Passenger[]; _count?: { redemptions: number };
};
type Redemption = {
  id: string; tripId: string | null; origin: string; destination: string;
  issuanceDate: string; outboundDate: string; returnDate: string | null;
  program: string; cabin: string; milesUsed: number; feesPaid: string | number;
  cashReferencePrice: string | number | null; cashReferenceDate: string | null;
  cashReferenceSource: string | null; bookingLocator: string | null; status: string;
  notes: string | null; deletedAt: string | null;
  trip?: (Trip & { passengers: Passenger[] }) | null;
};
type RedemptionForm = {
  tripId: string; origin: string; destination: string; issuanceDate: string; outboundDate: string;
  returnDate: string; program: string; cabin: string; milesUsed: string; feesPaid: string;
  cashReferencePrice: string; cashReferenceDate: string; cashReferenceSource: string;
  bookingLocator: string; status: string; notes: string;
};
const emptyRedemption: RedemptionForm = {
  tripId: "", origin: "", destination: "", issuanceDate: new Date().toISOString().slice(0, 10),
  outboundDate: "", returnDate: "", program: "", cabin: "Executiva", milesUsed: "0", feesPaid: "0",
  cashReferencePrice: "", cashReferenceDate: "", cashReferenceSource: "", bookingLocator: "",
  status: "ISSUED", notes: "",
};
const dateText = (value?: string | null) => value ? new Date(value).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "—";
const numberText = (value: number) => value.toLocaleString("pt-BR");
const moneyText = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const statusLabel: Record<string, string> = {
  PLANNED: "Planejado", ISSUED: "Emitido", TRIP_COMPLETED: "Viagem concluída",
  CANCELLED: "Cancelado", REFUNDED: "Reembolsado",
};
const inputClass = "mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#c6a45c] focus:ring-2 focus:ring-[#c6a45c]/15";

export function PersonalTravel() {
  const [tab, setTab] = useState<"redemptions" | "trips" | "trash" | "explore">("redemptions");
  const [trips, setTrips] = useState<Trip[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [trash, setTrash] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!error && !notice) return;
    const timeout = window.setTimeout(() => {
      setError("");
      setNotice("");
    }, 5000);
    return () => window.clearTimeout(timeout);
  }, [error, notice]);
  const [query, setQuery] = useState("");
  const [showRedemptionForm, setShowRedemptionForm] = useState(false);
  const [showTripForm, setShowTripForm] = useState(false);
  const [redemptionForm, setRedemptionForm] = useState<RedemptionForm>(emptyRedemption);
  const [tripForm, setTripForm] = useState({ title: "", origin: "", destination: "", outboundDate: "", returnDate: "", passengers: "", notes: "" });

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [tripResponse, redemptionResponse, trashResponse] = await Promise.all([
        fetch("/api/personal-trips", { cache: "no-store" }),
        fetch("/api/personal-redemptions", { cache: "no-store" }),
        fetch("/api/personal-redemptions?trash=true", { cache: "no-store" }),
      ]);
      const payloads = await Promise.all([tripResponse, redemptionResponse, trashResponse].map(async response => {
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          const message = Array.isArray(payload.message) ? payload.message.join(" ") : payload.message;
          throw new Error(message || "Não foi possível carregar seus dados.");
        }
        return payload;
      }));
      setTrips(payloads[0] as Trip[]);
      setRedemptions((payloads[1] as { records: Redemption[] }).records ?? []);
      setTrash((payloads[2] as { records: Redemption[] }).records ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível carregar seus dados.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pt-BR");
    return redemptions.filter(item => !normalized || [item.origin, item.destination, item.program, item.cabin, item.bookingLocator ?? "", item.trip?.title ?? ""].join(" ").toLocaleLowerCase("pt-BR").includes(normalized));
  }, [redemptions, query]);
  const totalMiles = redemptions.filter(item => item.status === "ISSUED" || item.status === "TRIP_COMPLETED").reduce((sum, item) => sum + item.milesUsed, 0);
  const totalFees = redemptions.reduce((sum, item) => sum + Number(item.feesPaid), 0);
  const withReference = redemptions.filter(item => item.status !== "CANCELLED" && item.status !== "REFUNDED" && item.cashReferencePrice !== null && item.cashReferencePrice !== undefined);
  const totalEstimatedSavings = withReference.reduce((sum, item) => sum + Number(item.cashReferencePrice) - Number(item.feesPaid), 0);
  const referenceMiles = withReference.reduce((sum, item) => sum + item.milesUsed, 0);
  const valuePerThousand = referenceMiles > 0 ? totalEstimatedSavings * 1000 / referenceMiles : null;

  async function submitJson(url: string, method: string, body?: unknown) {
    setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch(url, { method, headers: { "Content-Type": "application/json" }, ...(body ? { body: JSON.stringify(body) } : {}) });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = Array.isArray(payload.message) ? payload.message.join(" ") : payload.message;
        throw new Error(message || "Não foi possível concluir a operação.");
      }
      await load();
      return payload;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir a operação.");
      return null;
    } finally { setSaving(false); }
  }

  async function saveTrip(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const passengers = tripForm.passengers.split(/[,\n;]/).map(name => name.trim()).filter(Boolean);
    const result = await submitJson("/api/personal-trips", "POST", {
      ...tripForm, passengers, origin: tripForm.origin.toUpperCase(), destination: tripForm.destination.toUpperCase(),
      returnDate: tripForm.returnDate || null,
    });
    if (result) {
      setShowTripForm(false);
      setTripForm({ title: "", origin: "", destination: "", outboundDate: "", returnDate: "", passengers: "", notes: "" });
      setNotice("Viagem cadastrada. Os passageiros ficarão disponíveis aos resgates vinculados.");
    }
  }

  async function saveRedemption(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const result = await submitJson("/api/personal-redemptions", "POST", {
      ...redemptionForm,
      tripId: redemptionForm.tripId || null,
      origin: redemptionForm.origin.toUpperCase(), destination: redemptionForm.destination.toUpperCase(),
      returnDate: redemptionForm.returnDate || null,
      milesUsed: Number(redemptionForm.milesUsed), feesPaid: Number(redemptionForm.feesPaid),
      cashReferencePrice: redemptionForm.cashReferencePrice === "" ? null : Number(redemptionForm.cashReferencePrice),
      cashReferenceDate: redemptionForm.cashReferenceDate || null,
      cashReferenceSource: redemptionForm.cashReferenceSource || null,
      bookingLocator: redemptionForm.bookingLocator || null,
      allowSameRoute: false,
    });
    if (result) {
      setShowRedemptionForm(false); setRedemptionForm(emptyRedemption);
      setNotice("Resgate registrado e salvo na sua conta.");
    }
  }

  async function moveToTrash(item: Redemption) {
    if (!window.confirm("Mover este resgate para a lixeira? Você poderá restaurá-lo por até 30 dias.")) return;
    const result = await submitJson("/api/personal-redemptions/" + item.id, "DELETE");
    if (result) setNotice("Resgate movido para a lixeira.");
  }
  async function restore(item: Redemption) {
    const result = await submitJson("/api/personal-redemptions/" + item.id + "/restore", "POST");
    if (result) setNotice("Resgate restaurado.");
  }
  async function permanentlyDelete(item: Redemption) {
    if (!window.confirm("Excluir definitivamente este resgate? Esta ação é irreversível.")) return;
    const result = await submitJson("/api/personal-redemptions/" + item.id + "/permanent-delete", "POST");
    if (result) setNotice("Resgate excluído definitivamente.");
  }
  async function deleteTrip(trip: Trip) {
    if (!window.confirm("Excluir esta viagem? Os resgates vinculados serão preservados e ficarão sem viagem associada.")) return;
    const result = await submitJson("/api/personal-trips/" + trip.id, "DELETE");
    if (result) setNotice("Viagem excluída. Os resgates foram preservados e desvinculados.");
  }
  async function reassign(item: Redemption, tripId: string) {
    if (tripId === (item.tripId ?? "")) return;
    const destination = trips.find(trip => trip.id === tripId);
    const previous = trips.find(trip => trip.id === item.tripId);
    const confirmed = window.confirm("Mover este resgate para " + (destination?.title || (destination?.origin + " → " + destination?.destination) || "a viagem selecionada") + "? Os totais das viagens envolvidas serão atualizados e os passageiros passarão a ser os da nova viagem.");
    if (!confirmed) return;
    const result = await submitJson("/api/personal-redemptions/" + item.id, "PATCH", { tripId: tripId || null });
    if (result) setNotice("Vínculo atualizado. " + (previous ? "A viagem anterior foi recalculada. " : "") + "Os valores do resgate foram preservados.");
  }

  return <section className="space-y-5">
    <PageHeader className="items-start" eyebrow="VIAGENS E RESGATES" title={<>Passagens e resgates<span className="gold-period">.</span></>} description="Organize suas emissões, agrupe resgates por viagem e acompanhe os custos com transparência." actions={<><Button variant="outline" className="text-slate-900" onClick={() => void load()} disabled={loading || saving}><RefreshCw size={14} /> Atualizar</Button><Button onClick={() => { setRedemptionForm(emptyRedemption); setShowRedemptionForm(true); }}><Plus size={15} /> Novo resgate</Button></>} />

    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[{ label: "Resgates ativos", value: String(redemptions.length), icon: Plane, foot: "Emissões fora da lixeira" }, { label: "Milhas utilizadas", value: numberText(totalMiles), icon: Coins, foot: "Emitidos ou com viagem concluída; cancelados e reembolsados ficam fora" }, { label: "Taxas registradas", value: moneyText(totalFees), icon: Wallet, foot: "Valores informados pelo usuário" }, { label: "Economia estimada", value: withReference.length ? moneyText(totalEstimatedSavings) : "—", icon: CalendarDays, foot: withReference.length ? "Comparação com preços de referência informados" : "Informe preço e data de referência para calcular" }].map(k => <Card key={k.label} className="panel travel-summary-card"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-slate-500">{k.label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{k.value}</p></div><span className="rounded-xl bg-amber-50 p-2.5 text-amber-700"><k.icon size={19} /></span></div><p className="mt-2 text-xs text-slate-500">{k.foot}</p></Card>)}
    </div>
    {withReference.length > 0 && <p className="text-xs text-slate-500">Valor econômico estimado por milheiro: {valuePerThousand === null ? "—" : moneyText(valuePerThousand)}. É uma estimativa baseada nos preços de referência cadastrados, não o custo de compra das milhas.</p>}

    <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
      {([{ id: "redemptions", label: "Meus resgates" }, { id: "trips", label: "Minhas viagens" }, { id: "trash", label: "Lixeira" }, { id: "explore", label: "Explorar oportunidades" }] as const).map(item => <button key={item.id} type="button" onClick={() => setTab(item.id)} className={"rounded-lg px-3 py-2 text-sm font-medium transition " + (tab === item.id ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100")}>{item.label}{item.id === "trash" && trash.length ? " (" + trash.length + ")" : ""}</button>)}
    </div>

    {(error || notice) && <div className="fixed right-5 top-20 z-[100] w-[calc(100%-2.5rem)] max-w-md animate-in fade-in slide-in-from-top-2 duration-200">
      <Alert role={error ? "alert" : "status"} className={"flex items-start justify-between gap-3 shadow-lg " + (error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-800")}>
        <AlertDescription>{error || notice}</AlertDescription>
        <button onClick={() => { setError(""); setNotice(""); }} aria-label="Fechar aviso" className="shrink-0"><X size={16} /></button>
      </Alert>
    </div>}
    {loading ? <Card className="p-12 text-center text-sm text-slate-500">Carregando seus resgates e viagens…</Card> : tab === "explore" ? <Card className="p-8 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-700"><Search size={23} /></div><h2 className="mt-4 font-semibold text-slate-900">Explorar oportunidades</h2><p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">O feed comunitário com publicações da administração será implementado na próxima etapa. Nenhuma oportunidade fictícia será exibida como real.</p></Card>
      : tab === "trips" ? <div className="space-y-3"><div className="flex justify-end"><Button variant="outline" onClick={() => setShowTripForm(v => !v)}><Plus size={14} /> Nova viagem</Button></div>
        {showTripForm && <Card className="p-4"><h2 className="font-semibold text-slate-900">Cadastrar viagem</h2><form onSubmit={saveTrip} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Nome da viagem"><input value={tripForm.title} onChange={e => setTripForm({ ...tripForm, title: e.target.value })} placeholder="Ex.: Férias em Portugal" className={inputClass} /></Field>
          <Field label="Origem (IATA)" required><input required maxLength={3} value={tripForm.origin} onChange={e => setTripForm({ ...tripForm, origin: e.target.value.toUpperCase() })} placeholder="GRU" className={inputClass} /></Field>
          <Field label="Destino final (IATA)" required><input required maxLength={3} value={tripForm.destination} onChange={e => setTripForm({ ...tripForm, destination: e.target.value.toUpperCase() })} placeholder="LIS" className={inputClass} /></Field>
          <Field label="Data de ida" required><input type="date" required value={tripForm.outboundDate} onChange={e => setTripForm({ ...tripForm, outboundDate: e.target.value })} className={inputClass} /></Field>
          <Field label="Data de volta"><input type="date" value={tripForm.returnDate} onChange={e => setTripForm({ ...tripForm, returnDate: e.target.value })} className={inputClass} /></Field>
          <Field label="Passageiros (separe por vírgula)" ><input value={tripForm.passengers} onChange={e => setTripForm({ ...tripForm, passengers: e.target.value })} placeholder="Nome 1, Nome 2" className={inputClass} /></Field>
          <div className="sm:col-span-2 lg:col-span-3"><Field label="Observações"><textarea rows={2} value={tripForm.notes} onChange={e => setTripForm({ ...tripForm, notes: e.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 p-3 text-sm" /></Field></div>
          <div className="flex justify-end gap-2 sm:col-span-2 lg:col-span-3"><Button type="button" variant="outline" onClick={() => setShowTripForm(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Salvar viagem"}</Button></div>
        </form></Card>}
        {trips.length ? trips.map(trip => <Card key={trip.id} className="p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-900">{trip.title || trip.origin + " → " + trip.destination}</h2><p className="mt-1 text-sm text-slate-500">{trip.origin} → {trip.destination} · {dateText(trip.outboundDate)}{trip.returnDate ? " a " + dateText(trip.returnDate) : ""}</p><p className="mt-2 text-xs text-slate-500">Passageiros: {trip.passengers.map(p => p.name).join(", ") || "Não informados"} · {(trip._count?.redemptions ?? 0)} resgate(s) vinculado(s)</p></div><Button size="sm" variant="outline" onClick={() => void deleteTrip(trip)}><Trash2 size={14} /> Excluir viagem</Button></div></Card>) : <Empty title="Nenhuma viagem cadastrada" description="Crie uma viagem para agrupar resgates e compartilhar a lista de passageiros entre as emissões." />}
      </div>
        : tab === "trash" ? <div className="space-y-3">{trash.length ? trash.map(item => <Card key={item.id} className="flex flex-wrap items-center justify-between gap-3 p-4"><div><h2 className="font-semibold text-slate-900">{item.origin} → {item.destination}</h2><p className="mt-1 text-sm text-slate-500">{item.program} · Excluído em {dateText(item.deletedAt)}</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => void restore(item)}><Undo2 size={14} /> Restaurar</Button><Button variant="outline" size="sm" className="text-red-700" onClick={() => void permanentlyDelete(item)}><Trash2 size={14} /> Excluir definitivamente</Button></div></Card>) : <Empty title="Lixeira vazia" description="Resgates excluídos aparecerão aqui e poderão ser restaurados por até 30 dias." />}</div>
          : <div className="space-y-3">
            <Card className="p-3"><label className="relative block"><Search size={15} className="absolute left-3 top-3 text-slate-400" /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar rota, programa, localizador ou viagem…" className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-sm outline-none focus:border-[#c6a45c]" /></label></Card>
            {showRedemptionForm && <Card className="p-4"><div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold text-slate-900">Novo resgate</h2><p className="mt-1 text-xs text-slate-500">Milhas e taxas representam o total da emissão, não o valor por passageiro.</p></div><button onClick={() => setShowRedemptionForm(false)} aria-label="Fechar formulário"><X size={17} /></button></div>
              <form onSubmit={saveRedemption} className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Origem (IATA)" required><input required maxLength={3} value={redemptionForm.origin} onChange={e => setRedemptionForm({ ...redemptionForm, origin: e.target.value.toUpperCase() })} placeholder="GRU" className={inputClass} /></Field>
                <Field label="Destino (IATA)" required><input required maxLength={3} value={redemptionForm.destination} onChange={e => setRedemptionForm({ ...redemptionForm, destination: e.target.value.toUpperCase() })} placeholder="LIS" className={inputClass} /></Field>
                <Field label="Programa de fidelidade" required><input required value={redemptionForm.program} onChange={e => setRedemptionForm({ ...redemptionForm, program: e.target.value })} placeholder="Ex.: TAP Miles&Go" className={inputClass} /></Field>
                <Field label="Data de emissão" required><input type="date" required value={redemptionForm.issuanceDate} onChange={e => setRedemptionForm({ ...redemptionForm, issuanceDate: e.target.value })} className={inputClass} /></Field>
                <Field label="Data de ida" required><input type="date" required value={redemptionForm.outboundDate} onChange={e => setRedemptionForm({ ...redemptionForm, outboundDate: e.target.value })} className={inputClass} /></Field>
                <Field label="Data de volta"><input type="date" value={redemptionForm.returnDate} onChange={e => setRedemptionForm({ ...redemptionForm, returnDate: e.target.value })} className={inputClass} /></Field>
                <Field label="Cabine" required><select value={redemptionForm.cabin} onChange={e => setRedemptionForm({ ...redemptionForm, cabin: e.target.value })} className={inputClass}><option>Econômica</option><option>Executiva</option><option>Primeira classe</option><option>Premium Economy</option></select></Field>
                <Field label="Status"><select value={redemptionForm.status} onChange={e => setRedemptionForm({ ...redemptionForm, status: e.target.value })} className={inputClass}><option value="PLANNED">Planejado</option><option value="ISSUED">Emitido</option><option value="TRIP_COMPLETED">Viagem concluída</option><option value="CANCELLED">Cancelado</option><option value="REFUNDED">Reembolsado</option></select></Field>
                <Field label="Milhas utilizadas (total)" required><input type="number" min="0" step="1" required value={redemptionForm.milesUsed} onChange={e => setRedemptionForm({ ...redemptionForm, milesUsed: e.target.value })} className={inputClass} /></Field>
                <Field label="Taxas pagas (R$ total)" required><input type="number" min="0" step="0.01" required value={redemptionForm.feesPaid} onChange={e => setRedemptionForm({ ...redemptionForm, feesPaid: e.target.value })} className={inputClass} /></Field>
                <Field label="Viagem agrupadora"><select value={redemptionForm.tripId} onChange={e => setRedemptionForm({ ...redemptionForm, tripId: e.target.value })} className={inputClass}><option value="">Sem agrupamento</option>{trips.map(trip => <option key={trip.id} value={trip.id}>{trip.title || trip.origin + " → " + trip.destination}</option>)}</select></Field>
                <Field label="Preço equivalente em dinheiro (R$)"><input type="number" min="0" step="0.01" value={redemptionForm.cashReferencePrice} onChange={e => setRedemptionForm({ ...redemptionForm, cashReferencePrice: e.target.value })} className={inputClass} /></Field>
                <Field label="Data da pesquisa de preço"><input type="date" value={redemptionForm.cashReferenceDate} onChange={e => setRedemptionForm({ ...redemptionForm, cashReferenceDate: e.target.value })} className={inputClass} /></Field>
                <Field label="Fonte / link do preço"><input value={redemptionForm.cashReferenceSource} onChange={e => setRedemptionForm({ ...redemptionForm, cashReferenceSource: e.target.value })} placeholder="URL opcional" className={inputClass} /></Field>
                <Field label="Localizador (privado)"><input value={redemptionForm.bookingLocator} onChange={e => setRedemptionForm({ ...redemptionForm, bookingLocator: e.target.value })} className={inputClass} /></Field>
                <div className="sm:col-span-2 lg:col-span-3"><Field label="Observações"><textarea rows={2} value={redemptionForm.notes} onChange={e => setRedemptionForm({ ...redemptionForm, notes: e.target.value })} className="mt-1.5 w-full rounded-lg border border-slate-200 p-3 text-sm" /></Field></div>
                <div className="flex justify-end gap-2 border-t border-slate-100 pt-3 sm:col-span-2 lg:col-span-3"><Button type="button" variant="outline" onClick={() => setShowRedemptionForm(false)}>Cancelar</Button><Button type="submit" disabled={saving}>{saving ? "Salvando…" : "Registrar resgate"}</Button></div>
              </form>
            </Card>}
            {filtered.length ? filtered.map(item => {
              const hasReference = item.cashReferencePrice !== null && item.cashReferencePrice !== undefined;
              const savings = hasReference ? Number(item.cashReferencePrice) - Number(item.feesPaid) : null;
              const linkedTrip = trips.find(trip => trip.id === item.tripId);
              return <Card key={item.id} className="p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold text-slate-900">{item.origin} <span className="text-slate-400">→</span> {item.destination}</h2><Badge variant="secondary">{statusLabel[item.status] ?? item.status}</Badge></div><p className="mt-1 text-sm text-slate-500">{item.program} · {item.cabin} · Emitido em {dateText(item.issuanceDate)}</p><p className="mt-1 text-xs text-slate-500">Viagem: {linkedTrip ? (linkedTrip.title || linkedTrip.origin + " → " + linkedTrip.destination) : "Sem agrupamento"} · Ida {dateText(item.outboundDate)}{item.returnDate ? " · Volta " + dateText(item.returnDate) : ""}</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm"><span><strong>{numberText(item.milesUsed)}</strong> milhas</span><span><strong>{moneyText(Number(item.feesPaid))}</strong> em taxas</span>{hasReference && <span className={savings! >= 0 ? "text-emerald-700" : "text-red-700"}>Economia estimada: <strong>{moneyText(savings!)}</strong></span>}</div>{linkedTrip && <p className="mt-2 text-xs text-slate-500">Passageiros herdados: {linkedTrip.passengers.map(p => p.name).join(", ") || "Não informados"}</p>}</div><div className="flex min-w-[170px] flex-col gap-2 sm:items-end"><select aria-label="Agrupar em outra viagem" value={item.tripId ?? ""} onChange={e => void reassign(item, e.target.value)} className="h-9 max-w-full rounded-lg border border-slate-200 bg-white px-2 text-xs"><option value="">Sem agrupamento</option>{trips.map(trip => <option key={trip.id} value={trip.id}>{trip.title || trip.origin + " → " + trip.destination}</option>)}</select><Button variant="outline" size="sm" onClick={() => void moveToTrash(item)}><Trash2 size={14} /> Mover para lixeira</Button></div></div></Card>;
            }) : <Empty title={redemptions.length ? "Nenhum resgate encontrado" : "Seus resgates começam aqui"} description={redemptions.length ? "Altere a busca para encontrar outros registros." : "Registre uma emissão para acompanhar milhas, taxas, datas e referências financeiras. Os dados ficam vinculados à sua conta."} />}
          </div>}
  </section>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <label className="block text-xs font-medium text-slate-600">{label}{required && <span className="text-red-500"> *</span>}{children}</label>;
}
function Empty({ title, description }: { title: string; description: string }) {
  return <Card className="flex flex-col items-center px-6 py-12 text-center"><span className="rounded-2xl bg-slate-100 p-4 text-slate-500"><Plane size={24} /></span><h2 className="mt-4 font-semibold text-slate-900">{title}</h2><p className="mt-2 max-w-md text-sm text-slate-500">{description}</p></Card>;
}
