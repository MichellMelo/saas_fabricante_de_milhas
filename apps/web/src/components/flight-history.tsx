"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Download, FileSpreadsheet, LoaderCircle, MapPin, Plane, RefreshCw, Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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

export function FlightHistory() {
  const [records, setRecords] = useState<Availability[]>([]), [preview, setPreview] = useState<Availability[]>([]);
  const [search, setSearch] = useState(""), [program, setProgram] = useState("all"), [origin, setOrigin] = useState("all"), [destination, setDestination] = useState("all");
  const [loading, setLoading] = useState(true), [importing, setImporting] = useState(false), [message, setMessage] = useState(""), [error, setError] = useState("");
  const [selected, setSelected] = useState<Availability | null>(null);
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
    const a = document.createElement("a"); a.href = url; a.download = "historico-de-emissoes.csv"; a.click(); URL.revokeObjectURL(url);
  }
  const stats = [
    { label: "Registros encontrados", value: numberFormat.format(filtered.length), note: "de " + numberFormat.format(records.length) + " registros", icon: FileSpreadsheet },
    { label: "Programas", value: numberFormat.format(new Set(filtered.map(r => r.program)).size), note: "nos filtros atuais", icon: Plane },
    { label: "Rotas", value: numberFormat.format(new Set(filtered.map(r => r.origin + "-" + r.destination)).size), note: "origem e destino", icon: MapPin },
    { label: "Piso em milhas", value: numberFormat.format(totalMiles), note: "soma indicativa dos pisos", icon: CalendarDays },
  ];

  return <section className="space-y-6">
    <div className="welcome-row flex flex-wrap items-start justify-between gap-4"><div><div className="eyebrow"><span className="eyebrow-line" /> DISPONIBILIDADES PESQUISADAS</div><h1 className="page-title">Histórico de emissões<span className="gold-period">.</span></h1><p className="page-subtitle">Consulte os registros da planilha por programa, rota, classe e datas disponíveis.</p></div><div className="welcome-actions flex flex-wrap gap-2"><Button variant="outline" onClick={exportCsv} disabled={!filtered.length}><Download size={15}/> Exportar CSV</Button><Button onClick={() => fileRef.current?.click()}><Upload size={15}/> Importar planilha</Button><input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={e => void chooseFile(e.target.files?.[0])}/></div></div>
    {message && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>}
    {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</div>}
    {preview.length > 0 && <Card className="panel space-y-3 p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div className="flex items-center gap-2"><FileSpreadsheet size={20} className="text-emerald-700"/><div><strong className="text-slate-900">Prévia da importação</strong><p className="text-sm text-slate-500">{preview.length} linhas lidas; duplicados serão ignorados.</p></div></div><div className="flex gap-2"><Button variant="outline" onClick={() => {setPreview([]);if(fileRef.current)fileRef.current.value="";}}>Cancelar</Button><Button disabled={importing} onClick={() => void importRecords()}>{importing ? <LoaderCircle className="animate-spin" size={15}/> : <Upload size={15}/>} {importing ? "Importando..." : "Confirmar importação"}</Button></div></div><div className="grid gap-2 text-sm sm:grid-cols-3"><div className="rounded-lg bg-slate-50 p-3"><span className="text-slate-500">Programas distintos</span><p className="font-semibold">{new Set(preview.map(r=>r.program)).size}</p></div><div className="rounded-lg bg-slate-50 p-3"><span className="text-slate-500">Rotas distintas</span><p className="font-semibold">{new Set(preview.map(r=>r.origin+"-"+r.destination)).size}</p></div><div className="rounded-lg bg-slate-50 p-3"><span className="text-slate-500">Soma indicativa dos pisos</span><p className="font-semibold">{numberFormat.format(preview.reduce((s,r)=>s+r.milesFloor,0))}</p></div></div><p className="text-xs text-slate-500">A soma não representa saldo de milhas nem custo total.</p></Card>}
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{stats.map(item=><Card key={item.label} className="panel p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm text-slate-500">{item.label}</p><p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">{item.value}</p><p className="mt-1 text-xs text-slate-500">{item.note}</p></div><div className="rounded-xl bg-amber-50 p-2.5 text-amber-700"><item.icon size={19}/></div></div></Card>)}</div>
    <Card className="panel p-4"><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><label className="text-xs font-medium text-slate-600">Buscar<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Programa, mês ou aeroporto..." className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800 outline-none focus:border-[#c6a45c]"/></label><label className="text-xs font-medium text-slate-600">Programa<select value={program} onChange={e=>setProgram(e.target.value)} className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800"><option value="all">Todos os programas</option>{programs.map(p=><option key={p} value={p}>{p}</option>)}</select></label><label className="text-xs font-medium text-slate-600">Origem<select value={origin} onChange={e=>setOrigin(e.target.value)} className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800"><option value="all">Todas as origens</option>{origins.map(p=><option key={p} value={p}>{p}</option>)}</select></label><div className="flex items-end gap-2"><label className="min-w-0 flex-1 text-xs font-medium text-slate-600">Destino<select value={destination} onChange={e=>setDestination(e.target.value)} className="mt-1.5 block w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-normal text-slate-800"><option value="all">Todos os destinos</option>{destinations.map(p=><option key={p} value={p}>{p}</option>)}</select></label><Button variant="outline" size="icon" title="Limpar filtros" aria-label="Limpar filtros" onClick={()=>{setSearch("");setProgram("all");setOrigin("all");setDestination("all");}}><RefreshCw size={15}/></Button></div></div></Card>
    <Card className="panel overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-4"><div><h2 className="font-semibold text-slate-900">Disponibilidades registradas</h2><p className="text-sm text-slate-500">Ordenadas pela data em que a pesquisa foi registrada.</p></div><Badge variant="outline">{filtered.length} registros</Badge></div>
      {loading ? <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500"><LoaderCircle className="animate-spin" size={18}/> Carregando histórico...</div> : filtered.length === 0 ? <div className="flex flex-col items-center gap-3 px-5 py-14 text-center"><div className="rounded-2xl bg-slate-100 p-3 text-slate-500"><FileSpreadsheet size={25}/></div><h3 className="font-semibold text-slate-800">{records.length ? "Nenhum registro corresponde aos filtros" : "Importe sua planilha para começar"}</h3><p className="max-w-md text-sm text-slate-500">{records.length ? "Ajuste os filtros ou limpe a busca para ver outros registros." : "Exporte a aba Histórico de Emissões como CSV UTF-8 e selecione o arquivo em Importar planilha."}</p>{records.length === 0 && <Button onClick={()=>fileRef.current?.click()}><Upload size={15}/> Selecionar CSV</Button>}</div> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-4 py-3 font-medium">Registro</th><th className="px-4 py-3 font-medium">Rota</th><th className="px-4 py-3 font-medium">Programa</th><th className="px-4 py-3 font-medium">Classe</th><th className="px-4 py-3 text-right font-medium">Piso (milhas)</th><th className="px-4 py-3 font-medium">Meses disponíveis</th><th className="px-4 py-3 font-medium">Detalhes</th></tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((r,i)=><tr key={r.id ?? r.dateRegistered+"-"+r.program+"-"+r.origin+"-"+r.destination+"-"+i} className="hover:bg-slate-50/80"><td className="whitespace-nowrap px-4 py-3 text-slate-600">{dateFormat(r.dateRegistered)}</td><td className="whitespace-nowrap px-4 py-3"><strong className="text-slate-900">{r.origin} → {r.destination}</strong></td><td className="px-4 py-3 font-medium text-slate-800">{r.program}</td><td className="px-4 py-3"><Badge variant="outline">{r.cabinClass}</Badge></td><td className="whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums text-slate-900">{numberFormat.format(r.milesFloor)}</td><td className="max-w-[220px] px-4 py-3 text-slate-600"><span className="line-clamp-2">{r.monthsAvailable || "Não informado"}</span></td><td className="px-4 py-3"><Button variant="ghost" size="sm" onClick={()=>setSelected(r)}>Ver datas</Button></td></tr>)}</tbody></table></div>}
      {!loading && filtered.length > 0 && <div className="border-t border-slate-100 px-4 py-3 text-xs text-slate-500">Exibindo {filtered.length} registro(s); duplicidades exatas são ignoradas na importação.</div>}
    </Card>
    {selected && <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/35" onMouseDown={e=>{if(e.target===e.currentTarget)setSelected(null);}}><aside role="dialog" aria-modal="true" aria-label="Detalhes da disponibilidade" className="h-full w-full max-w-xl overflow-y-auto bg-white p-5 shadow-2xl sm:p-7"><div className="flex items-start justify-between"><div><p className="text-xs font-semibold uppercase tracking-widest text-amber-700">Disponibilidade registrada</p><h2 className="mt-2 text-2xl font-semibold text-slate-900">{selected.origin} → {selected.destination}</h2><p className="mt-1 text-sm text-slate-500">{selected.program} · {selected.cabinClass}</p></div><Button variant="ghost" size="icon" onClick={()=>setSelected(null)} aria-label="Fechar"><X size={18}/></Button></div><div className="mt-6 grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-50 p-4"><p className="text-xs text-slate-500">Data do registro</p><p className="mt-1 font-semibold">{dateFormat(selected.dateRegistered)}</p></div><div className="rounded-xl bg-amber-50 p-4"><p className="text-xs text-amber-800">Piso em milhas</p><p className="mt-1 font-semibold text-slate-900">{numberFormat.format(selected.milesFloor)}</p></div></div><div className="mt-5 space-y-5"><section><h3 className="font-semibold text-slate-900">Meses disponíveis</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{selected.monthsAvailable || "Não informado"}</p></section><section><h3 className="font-semibold text-slate-900">Datas de ida</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{selected.outboundDates || "Não informado"}</p></section><section><h3 className="font-semibold text-slate-900">Datas de volta</h3><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{selected.returnDates || "Não informado"}</p></section><p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900">Este registro representa a disponibilidade observada na data da pesquisa; não garante assento disponível hoje.</p></div></aside></div>}
  </section>;
}
