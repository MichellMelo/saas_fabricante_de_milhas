import { PageHeader } from "@/components/page-header";
"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign, Clock3, Download, FileText, Filter, Plane, Plus, Search, Ticket, Trash2, Pencil, X, Coins, Wallet, ArrowUpDown, MapPin, Users, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type FlightRecord = {
  id: string;
  travelDate: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  program: string;
  milesUsed: number;
  taxes: number;
  cashFare: number;
  cabin: "Econômica" | "Executiva" | "Primeira classe";
  emissionType: "Milhas" | "Dinheiro" | "Misto";
  status: "Realizada" | "Confirmada" | "Cancelada";
  passengers: number;
  notes: string;
};
const STORAGE_KEY = "fabricante-flight-records-v1";
const emptyForm: Omit<FlightRecord, "id"> = { travelDate: "", airline: "", flightNumber: "", origin: "", destination: "", program: "", milesUsed: 0, taxes: 0, cashFare: 0, cabin: "Econômica", emissionType: "Milhas", status: "Realizada", passengers: 1, notes: "" };
const brl = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const integer = (value: number) => value.toLocaleString("pt-BR");
const fmtDate = (value: string) => value ? new Date(value + "T12:00:00").toLocaleDateString("pt-BR") : "—";

export function FlightRecords() {
  const [records, setRecords] = useState<FlightRecord[]>([]);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [period, setPeriod] = useState("all");
  const [program, setProgram] = useState("all");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState<"recent" | "oldest">("recent");
  const [selected, setSelected] = useState<FlightRecord | null>(null);
  const [editing, setEditing] = useState<FlightRecord | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");
  const pageSize = 8;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved) setRecords(JSON.parse(saved) as FlightRecord[]);
    } catch { setNotice("Não foi possível recuperar os registros locais deste navegador."); }
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }, [records, ready]);

  const programs = useMemo(() => [...new Set(records.map(r => r.program).filter(Boolean))].sort(), [records]);
  const filtered = useMemo(() => records.filter(r => {
    const text = [r.airline, r.flightNumber, r.origin, r.destination, r.program, r.notes].join(" ").toLowerCase();
    const d = r.travelDate ? new Date(r.travelDate + "T12:00:00") : null;
    const now = new Date();
    const inPeriod = period === "all" || (d && (period === "year" ? d.getFullYear() === now.getFullYear() : period === "12m" ? d >= new Date(now.getFullYear(), now.getMonth() - 12, now.getDate()) : d >= new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())));
    return (!query || text.includes(query.toLowerCase())) && (program === "all" || r.program === program) && (status === "all" || r.status === status) && inPeriod;
  }).sort((a,b) => sort === "recent" ? b.travelDate.localeCompare(a.travelDate) : a.travelDate.localeCompare(b.travelDate)), [records, query, period, program, status, sort]);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageRecords = filtered.slice((page - 1) * pageSize, page * pageSize);
  const miles = filtered.reduce((s,r) => s + r.milesUsed, 0);
  const cash = filtered.reduce((s,r) => s + r.taxes + (r.emissionType === "Dinheiro" ? r.cashFare : 0), 0);
  const cashFareValue = filtered.reduce((s,r) => s + r.cashFare, 0);
  const upcoming = records.filter(r => r.status === "Confirmada" && r.travelDate >= new Date().toISOString().slice(0,10)).length;

  function openNew() { setEditing(null); setForm({ ...emptyForm }); setShowForm(true); }
  function openEdit(record: FlightRecord) { setEditing(record); const { id, ...values } = record; setForm(values); setShowForm(true); }
  function saveRecord(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form.travelDate || !form.origin.trim() || !form.destination.trim() || !form.airline.trim()) { setNotice("Preencha data, companhia, origem e destino."); return; }
    const record: FlightRecord = { ...form, id: editing?.id ?? (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now())), origin: form.origin.trim().toUpperCase(), destination: form.destination.trim().toUpperCase(), airline: form.airline.trim(), program: form.program.trim(), flightNumber: form.flightNumber.trim(), notes: form.notes.trim(), milesUsed: Math.max(0, Number(form.milesUsed) || 0), taxes: Math.max(0, Number(form.taxes) || 0), cashFare: Math.max(0, Number(form.cashFare) || 0), passengers: Math.max(1, Number(form.passengers) || 1) };
    setRecords(current => editing ? current.map(r => r.id === editing.id ? record : r) : [record, ...current]);
    setSelected(record); setShowForm(false); setNotice(editing ? "Passagem atualizada neste navegador." : "Passagem registrada neste navegador.");
  }
  function deleteRecord(record: FlightRecord) {
    if (!window.confirm("Excluir esta passagem? Esta ação não pode ser desfeita neste navegador.")) return;
    setRecords(current => current.filter(r => r.id !== record.id));
    if (selected?.id === record.id) setSelected(null);
    setNotice("Passagem excluída deste navegador.");
  }
  function exportCsv() {
    const headers = ["Data da viagem","Companhia","Voo","Origem","Destino","Programa","Milhas utilizadas","Taxas","Valor em dinheiro","Cabine","Tipo de emissão","Status","Passageiros","Observações"];
    const rows = filtered.map(r => [r.travelDate,r.airline,r.flightNumber,r.origin,r.destination,r.program,r.milesUsed,r.taxes,r.cashFare,r.cabin,r.emissionType,r.status,r.passengers,r.notes]);
    const csv = [headers, ...rows].map(row => row.map(v => '"' + String(v ?? "").replace(/"/g,'""') + '"').join(";")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a"); a.href = url; a.download = "historico-de-passagens.csv"; a.click(); URL.revokeObjectURL(url);
  }

  return <section className="space-y-5">
    <PageHeader eyebrow="VIAGENS E RESGATES" title={<>Histórico de passagens<span className="gold-period">.</span></>} description="Registre e acompanhe emissões feitas com milhas, dinheiro ou ambos." actions={<Button onClick={openNew}><Plus size={16}/> Nova passagem</Button>} />
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {[{label:"Passagens registradas",value:String(records.length),icon:Ticket,tone:"bg-blue-50 text-blue-600",foot:"Registros no seu histórico"},{label:"Milhas utilizadas",value:integer(records.reduce((s,r)=>s+r.milesUsed,0)),icon:Coins,tone:"bg-amber-50 text-amber-700",foot:"Milhas informadas"},{label:"Taxas e valores pagos",value:brl(records.reduce((s,r)=>s+r.taxes+(r.emissionType==="Dinheiro"?r.cashFare:0),0)),icon:Wallet,tone:"bg-emerald-50 text-emerald-700",foot:"Valores efetivamente registrados"},{label:"Próximas viagens",value:String(upcoming),icon:CalendarDays,tone:"bg-violet-50 text-violet-600",foot:"Emissões confirmadas"}].map(k => <Card key={k.label} className="p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-xs text-slate-500">{k.label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{k.value}</p></div><span className={"rounded-xl p-2.5 "+k.tone}><k.icon size={19}/></span></div><p className="mt-2 text-xs text-slate-500">{k.foot}</p></Card>)}
    </div>
    <Card className="space-y-4 p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[minmax(220px,1.5fr)_minmax(145px,1fr)_minmax(145px,1fr)_auto]">
        <label className="text-xs font-medium text-slate-600">Buscar<div className="relative mt-1.5"><Search size={15} className="absolute left-3 top-3 text-slate-400"/><input value={query} onChange={e=>{setQuery(e.target.value);setPage(1)}} placeholder="Destino, companhia, localizador..." className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none focus:border-[#c6a45c]"/></div></label>
        <label className="text-xs font-medium text-slate-600">Período<select value={period} onChange={e=>{setPeriod(e.target.value);setPage(1)}} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="all">Todos os períodos</option><option value="3m">Últimos 3 meses</option><option value="12m">Últimos 12 meses</option><option value="year">Ano atual</option></select></label>
        <label className="text-xs font-medium text-slate-600">Programa<select value={program} onChange={e=>{setProgram(e.target.value);setPage(1)}} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="all">Todos os programas</option>{programs.map(p=><option key={p}>{p}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-600">Status<select value={status} onChange={e=>{setStatus(e.target.value);setPage(1)}} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"><option value="all">Todos os status</option><option>Realizada</option><option>Confirmada</option><option>Cancelada</option></select></label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3"><p className="text-sm text-slate-500"><strong className="text-slate-800">{filtered.length}</strong> {filtered.length === 1 ? "passagem encontrada" : "passagens encontradas"}</p><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={()=>setSort(v=>v==="recent"?"oldest":"recent")}><ArrowUpDown size={14}/>{sort==="recent"?"Mais recentes":"Mais antigas"}</Button><Button variant="outline" onClick={exportCsv} disabled={!filtered.length}><Download size={14}/> Exportar CSV</Button></div></div>
    </Card>
    <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <Card className="overflow-hidden">
        {pageRecords.length ? <><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["Data da viagem","Rota","Companhia / programa","Tipo","Milhas","Valor (R$)","Status",""].map(h=><th key={h} className="px-3 py-3 font-medium">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{pageRecords.map(r=><tr key={r.id} onClick={()=>setSelected(r)} className={"cursor-pointer transition-colors hover:bg-amber-50/40 "+(selected?.id===r.id?"bg-blue-50/70":"")}><td className="whitespace-nowrap px-3 py-3 text-xs text-slate-600">{fmtDate(r.travelDate)}</td><td className="px-3 py-3"><div className="font-semibold text-slate-900">{r.origin} <span className="text-slate-400">→</span> {r.destination}</div><div className="text-xs text-slate-500">{r.cabin}</div></td><td className="px-3 py-3"><div className="font-medium text-slate-800">{r.airline}</div><div className="text-xs text-slate-500">{r.program || "Sem programa informado"}</div></td><td className="px-3 py-3"><Badge variant="secondary">{r.emissionType}</Badge></td><td className="whitespace-nowrap px-3 py-3 tabular-nums">{r.milesUsed?integer(r.milesUsed):"—"}</td><td className="whitespace-nowrap px-3 py-3 tabular-nums">{brl(r.taxes+(r.emissionType==="Dinheiro"?r.cashFare:0))}</td><td className="px-3 py-3"><span className={"inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium "+(r.status==="Realizada"?"bg-emerald-100 text-emerald-700":r.status==="Confirmada"?"bg-blue-100 text-blue-700":"bg-red-100 text-red-600")}>{r.status}</span></td><td className="px-2 py-3"><button aria-label="Editar passagem" className="rounded-md p-2 text-slate-500 hover:bg-slate-100" onClick={e=>{e.stopPropagation();openEdit(r)}}><Pencil size={14}/></button></td></tr>)}</tbody></table></div><div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500"><span>Mostrando {Math.min(filtered.length,(page-1)*pageSize+1)}–{Math.min(filtered.length,page*pageSize)} de {filtered.length}</span><div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={page<=1} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={14}/></Button><span>{page} / {totalPages}</span><Button size="sm" variant="outline" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}><ChevronRight size={14}/></Button></div></div></> : <div className="flex flex-col items-center px-6 py-14 text-center"><span className="rounded-2xl bg-slate-100 p-4 text-slate-500"><Plane size={25}/></span><h2 className="mt-4 font-semibold text-slate-900">{records.length?"Nenhuma passagem encontrada":"Seu histórico começa aqui"}</h2><p className="mt-2 max-w-md text-sm text-slate-500">{records.length?"Ajuste os filtros ou a busca para encontrar outras emissões.":"Registre uma emissão para acompanhar milhas utilizadas, taxas, custos e observações em um só lugar."}</p>{!records.length&&<Button className="mt-4" onClick={openNew}><Plus size={15}/> Registrar primeira passagem</Button>}</div>}
      </Card>
      {selected && <Card className="overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 p-4"><div><p className="text-xs text-slate-500">DETALHES DA PASSAGEM</p><h2 className="mt-1 font-semibold text-slate-900">{selected.origin} → {selected.destination}</h2></div><button className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100" aria-label="Fechar detalhes" onClick={()=>setSelected(null)}><X size={17}/></button></div><div className="space-y-4 p-4"><div><div className="flex items-center gap-2 font-semibold text-slate-900"><Building2 size={16} className="text-[#b38b35]"/>{selected.airline}</div><p className="mt-1 text-sm text-slate-500">{selected.program || "Programa não informado"}{selected.flightNumber ? " · Voo "+selected.flightNumber : ""}</p><div className="mt-3"><Badge variant="secondary">{selected.status}</Badge></div></div><div className="rounded-xl bg-slate-50 p-3"><div className="flex items-center justify-between"><div><p className="text-lg font-semibold">{selected.origin}</p><p className="text-xs text-slate-500">Origem</p></div><Plane size={18} className="text-[#b38b35]"/><div className="text-right"><p className="text-lg font-semibold">{selected.destination}</p><p className="text-xs text-slate-500">Destino</p></div></div><p className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-500">Data da viagem · {fmtDate(selected.travelDate)}</p></div><div className="space-y-2 text-sm"><p className="font-semibold text-slate-900">Informações da emissão</p><Detail label="Tipo de emissão" value={selected.emissionType}/><Detail label="Cabine" value={selected.cabin}/><Detail label="Passageiros" value={String(selected.passengers)}/><Detail label="Milhas utilizadas" value={integer(selected.milesUsed)}/><Detail label="Taxas pagas" value={brl(selected.taxes)}/><Detail label="Valor em dinheiro" value={brl(selected.cashFare)}/><Detail label="Custo por milheiro" value={selected.milesUsed?brl(selected.taxes*1000/selected.milesUsed):"—"}/></div>{selected.notes&&<div className="border-t border-slate-100 pt-3"><p className="text-sm font-semibold">Observações</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-600">{selected.notes}</p></div>}<div className="flex gap-2 border-t border-slate-100 pt-3"><Button variant="outline" className="flex-1" onClick={()=>openEdit(selected)}><Pencil size={14}/> Editar</Button><Button variant="outline" className="text-red-600 hover:bg-red-50" onClick={()=>deleteRecord(selected)}><Trash2 size={14}/></Button></div></div></Card>}
    </div>
    <p className="text-xs text-slate-400">Protótipo local: os registros ficam salvos neste navegador e ainda não são sincronizados com sua conta ou com o Supabase.</p>
    {notice&&<div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">{notice}<button className="ml-3 underline" onClick={()=>setNotice("")}>Fechar</button></div>}
    {showForm&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)setShowForm(false)}}><div role="dialog" aria-modal="true" aria-labelledby="flight-record-title" className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4"><div><h2 id="flight-record-title" className="text-lg font-semibold text-slate-900">{editing?"Editar passagem":"Nova passagem"}</h2><p className="text-xs text-slate-500">Informe os dados da emissão; campos financeiros não preenchidos permanecem zerados.</p></div><button aria-label="Fechar formulário" onClick={()=>setShowForm(false)} className="rounded-lg p-2 hover:bg-slate-100"><X size={18}/></button></div><form onSubmit={saveRecord} className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
      <Field label="Data da viagem" required><input type="date" required value={form.travelDate} onChange={e=>setForm({...form,travelDate:e.target.value})} className={inputClass}/></Field>
      <Field label="Companhia aérea" required><input required value={form.airline} onChange={e=>setForm({...form,airline:e.target.value})} placeholder="Ex.: TAP Air Portugal" className={inputClass}/></Field>
      <Field label="Número do voo"><input value={form.flightNumber} onChange={e=>setForm({...form,flightNumber:e.target.value})} placeholder="Ex.: TP 082" className={inputClass}/></Field>
      <Field label="Origem (IATA)" required><input required maxLength={3} value={form.origin} onChange={e=>setForm({...form,origin:e.target.value.toUpperCase()})} placeholder="GRU" className={inputClass}/></Field>
      <Field label="Destino (IATA)" required><input required maxLength={3} value={form.destination} onChange={e=>setForm({...form,destination:e.target.value.toUpperCase()})} placeholder="LIS" className={inputClass}/></Field>
      <Field label="Programa de fidelidade"><input value={form.program} onChange={e=>setForm({...form,program:e.target.value})} placeholder="Ex.: TAP Miles&Go" className={inputClass}/></Field>
      <Field label="Tipo de emissão"><select value={form.emissionType} onChange={e=>setForm({...form,emissionType:e.target.value as FlightRecord["emissionType"]})} className={inputClass}><option>Milhas</option><option>Dinheiro</option><option>Misto</option></select></Field>
      <Field label="Cabine"><select value={form.cabin} onChange={e=>setForm({...form,cabin:e.target.value as FlightRecord["cabin"]})} className={inputClass}><option>Econômica</option><option>Executiva</option><option>Primeira classe</option></select></Field>
      <Field label="Status"><select value={form.status} onChange={e=>setForm({...form,status:e.target.value as FlightRecord["status"]})} className={inputClass}><option>Realizada</option><option>Confirmada</option><option>Cancelada</option></select></Field>
      <Field label="Milhas utilizadas"><input type="number" min="0" step="1" value={form.milesUsed} onChange={e=>setForm({...form,milesUsed:Number(e.target.value)})} className={inputClass}/></Field>
      <Field label="Taxas pagas (R$)"><input type="number" min="0" step="0.01" value={form.taxes} onChange={e=>setForm({...form,taxes:Number(e.target.value)})} className={inputClass}/></Field>
      <Field label="Valor em dinheiro (R$)"><input type="number" min="0" step="0.01" value={form.cashFare} onChange={e=>setForm({...form,cashFare:Number(e.target.value)})} className={inputClass}/></Field>
      <Field label="Passageiros"><input type="number" min="1" step="1" value={form.passengers} onChange={e=>setForm({...form,passengers:Number(e.target.value)})} className={inputClass}/></Field>
      <div className="sm:col-span-2 lg:col-span-3"><Field label="Observações"><textarea rows={3} value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})} placeholder="Localizador, transferência bonificada, condições relevantes..." className={inputClass}/></Field></div>
      <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 sm:col-span-2 lg:col-span-3"><Button type="button" variant="outline" onClick={()=>setShowForm(false)}>Cancelar</Button><Button type="submit">{editing?"Salvar alterações":"Registrar passagem"}</Button></div>
    </form></div></div>}
  </section>;
}

const inputClass = "mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-[#c6a45c] focus:ring-2 focus:ring-[#c6a45c]/15";
function Field({label,required,children}:{label:string;required?:boolean;children:React.ReactNode}) { return <label className="block text-xs font-medium text-slate-600">{label}{required&&<span className="text-red-500"> *</span>}{children}</label>; }
function Detail({label,value}:{label:string;value:string}) { return <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-1.5"><span className="text-slate-500">{label}</span><strong className="text-right font-medium text-slate-800">{value}</strong></div>; }
