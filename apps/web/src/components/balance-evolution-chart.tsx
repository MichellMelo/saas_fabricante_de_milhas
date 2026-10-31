"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Clock3, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";

type Period = "30" | "90" | "365" | "all";
type ChartPoint = { date: string; balance: number };
type EvolutionResponse = {
  reliable: boolean;
  points: ChartPoint[];
  coverageStart: string | null;
  message: string | null;
};

const numberFormat = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 0,
});
const dateFormat = (value: string) =>
  new Date(`${value}T12:00:00Z`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "UTC",
  });

export function BalanceEvolutionChart() {
  const [period, setPeriod] = useState<Period>("30");
  const [data, setData] = useState<EvolutionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(
          `/api/loyalty-accounts/balance-evolution?period=${period}`,
          { cache: "no-store" },
        );
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(payload.message || "Não foi possível carregar a evolução dos saldos.");
        }
        if (!cancelled) setData(payload as EvolutionResponse);
      } catch (cause) {
        if (!cancelled) {
          setError(cause instanceof Error ? cause.message : "Falha ao carregar o histórico.");
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [period]);

  const chart = useMemo(() => {
    const raw = data?.points ?? [];
    if (raw.length < 2) return null;
    const stride = Math.max(1, Math.ceil(raw.length / 120));
    const sampled = raw.filter((_, index) => index % stride === 0 || index === raw.length - 1);
    const values = sampled.map((point) => point.balance);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const padding = max === min ? Math.max(max * 0.04, 1) : (max - min) * 0.12;
    const low = Math.max(0, min - padding);
    const high = max + padding || 1;
    const width = 640;
    const height = 220;
    const x = (index: number) => (index / Math.max(sampled.length - 1, 1)) * width;
    const y = (value: number) => height - ((value - low) / (high - low)) * height;
    const coordinates = sampled.map((point, index) => [x(index), y(point.balance)] as const);
    const line = coordinates.map(([px, py], index) => `${index === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`).join(" ");
    const area = `${line} L ${width} ${height} L 0 ${height} Z`;
    return { sampled, line, area, last: sampled[sampled.length - 1], first: sampled[0], min, max, low, high };
  }, [data]);

  const change = chart ? chart.last.balance - chart.first.balance : 0;

  return (
    <Card className="panel">
      <div className="panel-heading flex-wrap">
        <div>
          <h2>Evolução dos saldos</h2>
          <p>Histórico reconstruído a partir das movimentações registradas.</p>
        </div>
        <label className="text-sm text-slate-600">
          <span className="sr-only">Período do gráfico</span>
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as Period)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            aria-label="Período da evolução dos saldos"
          >
            <option value="30">30 dias</option>
            <option value="90">90 dias</option>
            <option value="365">12 meses</option>
            <option value="all">Todo o período</option>
          </select>
        </label>
      </div>

      {loading ? (
        <div className="flex min-h-64 items-center justify-center text-sm text-slate-500">
          Carregando histórico…
        </div>
      ) : error ? (
        <div role="alert" className="flex min-h-64 items-center justify-center gap-2 text-sm text-rose-700">
          <AlertCircle size={18} /> {error}
        </div>
      ) : data && !data.reliable ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-5 py-8 text-center">
          <div className="placeholder-mark"><AlertCircle size={24} /></div>
          <h3 className="font-semibold text-slate-800">Histórico incompleto</h3>
          <p className="max-w-md text-sm text-slate-500">
            {data.message || "Não foi possível validar a série histórica com os saldos atuais. O gráfico foi ocultado para evitar informações incorretas."}
          </p>
        </div>
      ) : !chart ? (
        <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-5 py-8 text-center">
          <div className="placeholder-mark"><Clock3 size={24} /></div>
          <h3 className="font-semibold text-slate-800">Ainda não há histórico suficiente</h3>
          <p className="max-w-md text-sm text-slate-500">
            Registre movimentações em Meus Pontos. Quando houver dados em datas distintas, a evolução aparecerá aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4 pt-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500">Saldo no fim do período</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
                {numberFormat.format(chart.last.balance)} <span className="text-sm font-normal text-slate-500">pontos</span>
              </p>
            </div>
            <div className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium ${change >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
              <TrendingUp size={15} className={change < 0 ? "rotate-180" : ""} />
              {change > 0 ? "+" : ""}{numberFormat.format(change)} no período
            </div>
          </div>
          <div className="w-full overflow-hidden">
            <svg viewBox="0 0 640 250" role="img" aria-label="Gráfico da evolução diária do saldo em pontos" className="h-auto w-full overflow-visible">
              {[0, 1, 2, 3].map((tick) => {
                const y = 12 + tick * 68;
                return <line key={tick} x1="0" x2="640" y1={y} y2={y} stroke="#e8eaf0" strokeDasharray="4 5" />;
              })}
              <g transform="translate(0 12)">
                <path d={chart.area} fill="#c6a45c" opacity="0.14" />
                <path d={chart.line} fill="none" stroke="#a7894e" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="640" cy={chart.line.match(/L 640 ([\d.]+)/)?.[1] ?? "110"} r="5" fill="#a7894e" stroke="white" strokeWidth="3" />
              </g>
            </svg>
            <div className="flex justify-between text-xs text-slate-400">
              <span>{dateFormat(chart.first.date)}</span>
              <span>{dateFormat(chart.last.date)}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            {data?.coverageStart
              ? `Dados disponíveis desde ${new Date(data.coverageStart).toLocaleDateString("pt-BR")}.`
              : "Série baseada nas movimentações registradas."}
            {" "}A visualização considera apenas contas ativas com saldo em pontos.
          </p>
        </div>
      )}
    </Card>
  );
}
