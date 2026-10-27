"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Download, FileSpreadsheet, LoaderCircle, MapPin, Plane, RefreshCw, Upload, X, ArrowUpDown, ChevronRight, Coins, Route, Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Availability = { id?: string; dateRegistered: string; program: string; cabinClass: string; origin: string; destination: string; milesFloor: number; monthsAvailable: string; outboundDates: string; returnDates: string };
const HEADERS = ["Data_Registro", "Programa", "Classe", "Origem", "Destino", "Milhas_Piso", "Meses_Disponiveis", "Datas_Ida", "Datas_Volta"];
const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase().replace(/[\s_-]+/g, "");
function parseCsv(text: string): string[][] {
  const first = text.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = []; let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"' && quoted && text[i + 1] === '"') { cell += '"'; i++; }
    else if (ch === '"') quoted = !quoted;
    else if (ch === delimiter && !quoted) { row.push(cell); cell = ""; }
    else if ((ch === "\n" || ch === "\r") && !quoted) { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); if (row.some(v => v.trim())) rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  if (cell.length || row.length) { row.push(cell); if (row.some(v => v.trim())) rows.push(row); }
  return rows;
}
function parseDate(value: string): string {
  const v = value.trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(v)) return v.slice(0, 10);
  const br = v.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (br) return br[3] + "-" + br[2].padStart(2, "0") + "-" + br[1].padStart(2, "0");
  const d = new Date(v); if (Number.isNaN(d.getTime())) throw new Error("Data de registro inválida: " + v);
  return d.toISOString().slice(0, 10);
}
function parseRecords(text: string): Availability[] {
  const rows = parseCsv(text.replace(/^\uFEFF/, ""));
  if (rows.length < 2) throw new Error("O CSV precisa conter cabeçalho e pelo menos um registro.");
  const headers = rows[0].map(normalize), index = (header: string) => headers.indexOf(normalize(header));
  const missing = HEADERS.filter(header => index(header) < 0);
  if (missing.length) throw new Error("Colunas ausentes: " + missing.join(", ") + ".");
  return rows.slice(1).map((row, i) => {
    const get = (header: string) => (row[index(header)] ?? "").trim();
    const miles = Number(get("Milhas_Piso").replace(/\./g, "").replace(",", "."));
    const origin = get("Origem").toUpperCase(), destination = get("Destino").toUpperCase();
    if (!get("Programa") || !get("Classe") || !/^[A-Z]{3}$/.test(origin) || !/^[A-Z]{3}$/.test(destination) || !Number.isFinite(miles) || miles < 0) throw new Error("Confira programa, classe, aeroportos e milhas na linha " + (i + 2) + ".");
    return { dateRegistered: parseDate(get("Data_Registro")), program: get("Programa"), cabinClass: get("Classe"), origin, destination, milesFloor: Math.round(miles), monthsAvailable: get("Meses_Disponiveis"), outboundDates: get("Datas_Ida"), returnDates: get("Datas_Volta") };
  });
}
const numberFormat = new Intl.NumberFormat("pt-BR");
const dateFormat = (value: string) => new Date(value.slice(0, 10) + "T12:00:00").toLocaleDateString("pt-BR");
const PAGE_SIZE = 10;

export function FlightHistory() {
  const [records, setRecords] = useState<Availability[]>([]), [preview, setPreview] = useState<Availability[]>([]);
  const [search, setSearch] = useState(""), [program, setProgram] = useState("all"), [origin, setOrigin] = useState("all"), [destination, setDestination] = useState("all");
  const [loading, setLoading] = useState(true), [importing, setImporting] = useState(false), [message, setMessage] = useState(""), [error, setError] = useState("");
  const [selected, setSelected] = useState<Availability | null>(null), [currentPage, setCurrentPage] = useState(1);
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadRecords() {
    setLoading(true); setError("");
    try { const response = await fetch("/api/flight-availability", { cache: "no-store" }); const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.message || "Não foi possível carregar o histórico."); setRecords(Array.isArray(payload.records) ? payload.records : []); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao carregar os registros."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void loadRecords(); }, []);
  const programs = useMemo(() => [...new Set(records.map(r => r.program))].sort((a,b) => a.localeCompare(b, "pt-BR")), [records]);
  const origins = useMemo(() => [...new Set(records.map(r => r.origin))].sort(), [records]);
  const destinations = useMemo(() => [...new Set(records.map(r => r.destination))].sort(), [records]);
  const filtered = useMemo(() => records.filter(r => {
    const q = search.trim().toLowerCase();
    return (program === "all" || r.program === program) && (origin === "all" || r.origin === origin) && (destination === "all" || r.destination === destination) && (!q || [r.program,r.cabinClass,r.origin,r.destination,r.monthsAvailable,r.outboundDates,r.returnDates].some(v => v.toLowerCase().includes(q)));
  }), [records, search, program, origin, destination]);
  const totalMiles = filtered.reduce((sum, record) => sum + record.milesFloor, 0);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageRecords = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  useEffect(() => { setCurrentPage(1); }, [search, program, origin, destination]);
  useEffect(() => { if (currentPage > totalPages) setCurrentPage(totalPages); }, [currentPage, totalPages]);

  async function chooseFile(file?: File) {
    setMessage(""); setError(""); setPreview([]); if (!file) return;
    if (!file.name.toLowerCase().endsWith(".csv")) { setError("Salve a aba como CSV UTF-8 e selecione o arquivo .csv."); return; }
    try { const parsed = parseRecords(await file.text()); setPreview(parsed); setMessage(parsed.length + " registros prontos para conferência; nenhum dado foi salvo ainda."); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Não foi possível ler o arquivo."); }
  }
  async function importRecords() {
    setImporting(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/flight-availability", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ records: preview }) });
      const payload = await response.json().catch(() => ({})); if (!response.ok) throw new Error(payload.message || "Falha ao importar os registros.");
      setMessage(payload.message || "Importação concluída."); setPreview([]); if (fileRef.current) fileRef.current.value = ""; await loadRecords();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Falha ao importar os registros."); }
    finally { setImporting(false); }
  }
  function exportCsv() {
    const escape = (v: string | number) => '"' + String(v).replace(/"/g, '""') + '"';
    const lines = [HEADERS.join(","), ...filtered.map(r => [r.dateRegistered,r.program,r.cabinClass,r.origin,r.destination,r.milesFloor,r.monthsAvailable,r.outboundDates,r.returnDates].map(escape).join(","))];
    const url = URL.createObjectURL(new Blob(["\uFEFF" + lines.join("\r\n")], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a"); a.href = url; a.download = "historico-de-disponibilidades.csv"; a.click(); URL.revokeObjectURL(url);
  }
  const stats = [
    { label: "Disponibilidades registradas", value: numberFormat.format(filtered.length), note: `de ${numberFormat.format(records.length)} registros`, icon: FileSpreadsheet, tone: "blue" },
    { label: "Programas monitorados", value: numberFormat.format(new Set(filtered.map(r => r.program)).size), note: "nos filtros atuais", icon: Coins, tone: "gold" },
    { label: "Rotas identificadas", value: numberFormat.format(new Set(filtered.map(r => r.origin + "-" + r.destination)).size), note: "origem e destino", icon: Route, tone: "violet" },
    { label: "Menor piso encontrado", value: filtered.length ? numberFormat.format(Math.min(...filtered.map(r => r.milesFloor))) : "—", note: "milhas, conforme os filtros", icon: Sparkles, tone: "green" },
  ];  return <section className="space-y-5">
    <div className="welcome-row">
      <div><div className="eyebrow"><span className="eyebrow-line" /> BASE PARA FUTURAS EMISSÕES</div><h1 className="page-title">Histórico de disponibilidades<span className="gold-period">.</span></h1><p className="page-subtitle">Compare rotas, programas e pisos de milhas registrados ao longo do tempo.</p></div>
      <div className="flex flex-wrap gap-2"><Button variant="outline" onClick={exportCsv} disabled={!filtered.length}><Download size={15}/> Exportar CSV</Button><Button onClick={() => fileRef.current?.click()}><Upload size={15}/> Importar CSV</Button><input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => void chooseFile(e.target.files?.[0])}/></div>
    </div>
    {message && <Alert role="status" className="border-emerald-200 bg-emerald-50 text-emerald-800"><AlertDescription>{message}</AlertDescription></Alert>}
    {error && <Alert role="alert" className="border-rose-200 bg-rose-50 text-rose-800"><AlertDescription>{error}</AlertDescription></Alert>}
    {preview.length > 0 && <Card className="space-y-3 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-3"><span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><FileSpreadsheet size={20}/></span><div><strong className="text-slate-900">Prévia da importação</strong><p className="text-sm text-slate-500">{preview.length} linhas lidas; duplicados serão ignorados.</p></div></div><div className="flex gap-2"><Button variant="outline" onClick={() => {setPreview([]);if(fileRef.current)fileRef.current.value="";}}>Cancelar</Button><Button disabled={importing} onClick={() => void importRecords()}>{importing ? <LoaderCircle className="animate-spin" size={15}/> : <Upload size={15}/>} {importing ? "Importando..." : "Confirmar importação"}</Button></div></div><div className="grid gap-2 text-sm sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-3"><span className="text-slate-500">Programas distintos</span><p className="font-semibold">{new Set(preview.map(r=>r.program)).size}</p></div><div className="rounded-xl bg-slate-50 p-3"><span className="text-slate-500">Rotas distintas</span><p className="font-semibold">{new Set(preview.map(r=>r.origin+"-"+r.destination)).size}</p></div><div className="rounded-xl bg-amber-50 p-3"><span className="text-amber-800">Soma indicativa dos pisos</span><p className="font-semibold">{numberFormat.format(preview.reduce((sum,r)=>sum+r.milesFloor,0))}</p></div></div><p className="text-xs text-slate-500">A soma não representa saldo de milhas nem custo total.</p></Card>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(item=><Card key={item.label} className="relative overflow-hidden p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-slate-500">{item.label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">{item.value}</p><p className="mt-1 text-xs text-slate-500">{item.note}</p></div><span className={`rounded-xl p-3 ${item.tone==="blue"?"bg-blue-50 text-blue-600":item.tone==="gold"?"bg-amber-50 text-amber-700":item.tone==="violet"?"bg-violet-50 text-violet-600":"bg-emerald-50 text-emerald-700"}`}><item.icon size={20}/></span></div><div className={`absolute bottom-0 left-0 h-1 w-full ${item.tone==="blue"?"bg-blue-500":item.tone==="gold"?"bg-amber-400":item.tone==="violet"?"bg-violet-500":"bg-emerald-500"}`}/></Card>)}</div>
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-800"><Search size={14}/><span>Refinar disponibilidades</span></div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(200px,1.4fr)_minmax(150px,1fr)_minmax(130px,.8fr)_minmax(130px,.8fr)_auto]">
        <label className="text-xs font-medium text-slate-600">Buscar<div className="relative mt-1.5"><Search size={15} className="absolute left-3 top-3 text-slate-400"/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Programa, mês ou aeroporto..." className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm font-normal text-slate-800 outline-none focus:border-[#c6a45c]"/></div></label>
        <label className="text-xs font-medium text-slate-600">Programa<select value={program} onChange={e=>setProgram(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800"><option value="all">Todos os programas</option>{programs.map(p=><option key={p} value={p}>{p}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-600">Origem<select value={origin} onChange={e=>setOrigin(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800"><option value="all">Todas</option>{origins.map(p=><option key={p} value={p}>{p}</option>)}</select></label>
        <label className="text-xs font-medium text-slate-600">Destino<select value={destination} onChange={e=>setDestination(e.target.value)} className="mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-normal text-slate-800"><option value="all">Todos</option>{destinations.map(p=><option key={p} value={p}>{p}</option>)}</select></label>
        <div className="flex items-end"><Button variant="outline" className="w-full" onClick={()=>{setSearch("");setProgram("all");setOrigin("all");setDestination("all");}}><RefreshCw size={14}/> Limpar</Button></div>
      </div>
    </Card>
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4"><div><h2 className="font-semibold text-slate-900">Disponibilidades registradas</h2><p className="mt-1 text-sm text-slate-500">Registros observados nas pesquisas — não garantem disponibilidade atual.</p></div><Badge variant="outline">{numberFormat.format(filtered.length)} registros</Badge></div>
      {loading ? <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18}/> Carregando histórico...</div> : filtered.length === 0 ? <div className="flex flex-col items-center gap-3 px-5 py-14 text-center"><div className="rounded-2xl bg-blue-50 p-4 text-blue-600"><FileSpreadsheet size={26}/></div><h3 className="font-semibold text-slate-800">{records.length ? "Nenhum registro corresponde aos filtros" : "Importe seu histórico para começar"}</h3><p className="max-w-md text-sm text-slate-500">{records.length ? "Ajuste os filtros ou limpe a busca para ver outros registros." : "Importe o CSV de disponibilidades para construir uma base de referência para futuras emissões. Nenhum dado demonstrativo será exibido."}</p>{records.length===0&&<Button onClick={()=>fileRef.current?.click()}><Upload size={15}/> Selecionar CSV</Button>}</div> : <div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3 font-medium">Data do registro</th><th className="px-4 py-3 font-medium">Rota</th><th className="px-4 py-3 font-medium">Programa</th><th className="px-4 py-3 font-medium">Classe</th><th className="px-4 py-3 text-right font-medium">Piso em milhas</th><th className="px-4 py-3 font-medium">Meses disponíveis</th><th className="px-4 py-3 text-right font-medium">Detalhes</th></tr></thead><tbody className="divide-y divide-slate-100">{pageRecords.map((r,i)=>{const brand=r.program.toLowerCase();const tone=brand.includes("azul")?"bg-blue-50 text-blue-700":brand.includes("latam")?"bg-red-50 text-red-700":brand.includes("smiles")||brand.includes("gol")?"bg-orange-50 text-orange-700":brand.includes("tap")?"bg-emerald-50 text-emerald-700":brand.includes("iberia")?"bg-rose-50 text-rose-700":"bg-slate-100 text-slate-700";const initials=r.program.split(/\\s|&/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase();return <tr key={r.id??r.dateRegistered+"-"+r.program+"-"+r.origin+"-"+r.destination+"-"+i} className="cursor-pointer transition-colors hover:bg-amber-50/40" onClick={()=>setSelected(r)}><td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">{dateFormat(r.dateRegistered)}</td><td className="whitespace-nowrap px-4 py-3"><div className="font-semibold text-slate-900">{r.origin}<span className="mx-2 text-slate-400">→</span>{r.destination}</div><div className="mt-1 flex items-center gap-1 text-[11px] text-slate-400"><MapPin size={11}/>{r.origin} para {r.destination}</div></td><td className="px-4 py-3"><div className="flex items-center gap-2.5"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold ${tone}`}>{initials}</span><span className="min-w-0"><span className="block max-w-[145px] truncate font-semibold text-slate-800">{r.program}</span><span className="text-[11px] text-slate-400">Programa de fidelidade</span></span></div></td><td className="px-4 py-3"><Badge variant="outline" className="bg-slate-50">{r.cabinClass}</Badge></td><td className="whitespace-nowrap px-4 py-3 text-right"><span className="font-semibold tabular-nums text-slate-900">{numberFormat.format(r.milesFloor)}</span><span className="ml-1 text-[10px] text-slate-400">milhas</span></td><td className="max-w-[190px] px-4 py-3"><span className="line-clamp-2 text-xs leading-5 text-slate-600">{r.monthsAvailable||"Não informado"}</span></td><td className="px-4 py-3 text-right"><button className="inline-flex items-center gap-1 rounded-lg px-2.5 py-2 text-xs font-medium text-slate-600 hover:bg-white hover:text-slate-950" onClick={e=>{e.stopPropagation();setSelected(r)}}>Ver detalhes <ChevronRight size={14}/></button></td></tr>})}</tbody></table></div>}
      {!loading&&filtered.length>0&&<div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500">Exibindo {((currentPage-1)*PAGE_SIZE)+1}–{Math.min(currentPage*PAGE_SIZE,filtered.length)} de {numberFormat.format(filtered.length)} registros</p><div className="flex items-center gap-2"><span className="mr-2 text-xs text-slate-500">Página {currentPage} de {totalPages}</span><Button type="button" variant="outline" size="sm" disabled={currentPage<=1} onClick={()=>setCurrentPage(p=>Math.max(1,p-1))}>Anterior</Button><Button type="button" variant="outline" size="sm" disabled={currentPage>=totalPages} onClick={()=>setCurrentPage(p=>Math.min(totalPages,p+1))}>Próxima</Button></div></div>}
    </Card>
    <Drawer open={Boolean(selected)} onOpenChange={(open) => { if (!open) setSelected(null); }}>
      <DrawerContent>
        {selected && <>
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-6 sm:px-7">
            <DrawerHeader className="p-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">Disponibilidade registrada</p>
              <DrawerTitle className="mt-1 text-3xl tracking-tight">{selected.origin} → {selected.destination}</DrawerTitle>
              <DrawerDescription>{selected.program} · {selected.cabinClass}</DrawerDescription>
            </DrawerHeader>
            <DrawerClose aria-label="Fechar detalhes" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"><X size={19}/></DrawerClose>
          </div>
          <div className="flex-1 space-y-7 overflow-y-auto p-6 sm:p-7">
            <div className="grid grid-cols-2 gap-3.5">
              <div className="rounded-2xl bg-slate-50 p-5"><p className="text-xs text-slate-500">Data do registro</p><p className="mt-1 font-semibold text-slate-900">{dateFormat(selected.dateRegistered)}</p></div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><p className="text-xs text-amber-800">Piso em milhas</p><p className="mt-1 text-xl font-semibold text-slate-900">{numberFormat.format(selected.milesFloor)}</p></div>
            </div>
            <section><h3 className="font-semibold text-slate-900">Meses disponíveis</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{selected.monthsAvailable||"Não informado"}</p></section>
            <section><h3 className="font-semibold text-slate-900">Datas de ida</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{selected.outboundDates||"Não informado"}</p></section>
            <section><h3 className="font-semibold text-slate-900">Datas de volta</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{selected.returnDates||"Não informado"}</p></section>
            <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-5 text-amber-900"><CalendarDays size={18} className="mt-0.5 shrink-0"/><p>Este registro representa a disponibilidade observada na data da pesquisa; não garante assento disponível hoje.</p></div>
          </div>
        </>}
      </DrawerContent>
    </Drawer>
  </section>;
}
