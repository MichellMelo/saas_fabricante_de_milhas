"use client";

import { useMemo, useState } from "react";
import { Calculator, ArrowLeftRight, Plane, RotateCcw, Info, Wallet } from "lucide-react";

type ToolKey = "milheiro" | "transferencia" | "resgate" | "venda";
type ProgramKey = "latam" | "smiles" | "azul" | "tap" | "iberia" | "qatar" | "aeroplan" | "american";
const MILEIRO_REFERENCES: Record<ProgramKey, { label: string; good: number }> = {
  latam: { label: "LATAM Pass", good: 25 },
  smiles: { label: "Smiles", good: 15 },
  azul: { label: "Azul Fidelidade", good: 13 },
  tap: { label: "TAP Miles&Go", good: 50 },
  iberia: { label: "Iberia Plus", good: 80 },
  qatar: { label: "Qatar Privilege Club", good: 60 },
  aeroplan: { label: "Aeroplan", good: 80 },
  american: { label: "American Airlines (AAdvantage)", good: 100 },
};

const currency = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
const number = (value: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 }).format(value);
const parse = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

function Field({
  label,
  value,
  onChange,
  suffix,
  hint,
  min = "0",
  step = "any",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  hint: string;
  min?: string;
  step?: string;
}) {
  return (
    <label className="block min-w-0 space-y-2">
      <span className="block text-sm font-medium text-slate-700">{label}</span>
      <span className="flex min-w-0 items-center rounded-xl border border-slate-200 bg-white focus-within:border-[#b9954d] focus-within:ring-2 focus-within:ring-[#c6a45c]/20">
        <input
          type="number"
          min={min}
          step={step}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="!m-0 w-full min-w-0 appearance-none rounded-xl border-0 bg-transparent px-3 py-3 text-base text-slate-900 shadow-none outline-none ring-0 focus:!border-0 focus:!shadow-none focus:!ring-0 focus-visible:!outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        {suffix && <span className="shrink-0 pr-3 text-xs text-slate-500">{suffix}</span>}
      </span>
      <span className="block rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">{hint}</span>
    </label>
  );
}

function Result({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div className="rounded-xl border border-[#c6a45c]/25 bg-[#f8f5ed] p-4">
      <div className="text-xs font-semibold uppercase tracking-[.12em] text-slate-500">{label}</div>
      <div className="mt-2 break-words text-2xl font-semibold tracking-tight text-[#111b2b]">{value}</div>
      {detail && <p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p>}
    </div>
  );
}

export function CalculatorTools() {
  const [active, setActive] = useState<ToolKey>("milheiro");
  const [paid, setPaid] = useState("0");
  const [fees, setFees] = useState("0");
  const [points, setPoints] = useState("0");
  const [program, setProgram] = useState<ProgramKey>("latam");
  const [originPoints, setOriginPoints] = useState("0");
  const [bonus, setBonus] = useState("0");
  const [firstTransferBonus, setFirstTransferBonus] = useState("0");
  const [originCost, setOriginCost] = useState("0");
  const [transferFees, setTransferFees] = useState("0");
  const [cashFare, setCashFare] = useState("0");
  const [awardMiles, setAwardMiles] = useState("0");
  const [awardFees, setAwardFees] = useState("120");
  const [personalCpm, setPersonalCpm] = useState("0");
  const [saleCpm, setSaleCpm] = useState("0");
  const [saleMiles, setSaleMiles] = useState("0");
  const [saleTotal, setSaleTotal] = useState("0");
  const [saleFees, setSaleFees] = useState("0");

  const milheiro = useMemo(() => {
    const total = Math.max(0, parse(paid)) + Math.max(0, parse(fees));
    const qty = Math.max(0, parse(points));
    return { total, qty, cpm: qty > 0 ? (total / qty) * 1000 : 0 };
  }, [paid, fees, points]);

  const transfer = useMemo(() => {
    const qty = Math.max(0, parse(originPoints));
    const percentageBonusMiles = qty * (1 + Math.max(0, parse(bonus)) / 100);
    const firstTransferBonusMiles = Math.max(0, parse(firstTransferBonus));
    const finalMiles = percentageBonusMiles + firstTransferBonusMiles;
    const totalCost = Math.max(0, parse(originCost)) + Math.max(0, parse(transferFees));
    return { finalMiles, totalCost, cpm: finalMiles > 0 ? (totalCost / finalMiles) * 1000 : 0 };
  }, [originPoints, bonus, firstTransferBonus, originCost, transferFees]);

  const redemption = useMemo(() => {
    const cash = Math.max(0, parse(cashFare));
    const miles = Math.max(0, parse(awardMiles));
    const taxes = Math.max(0, parse(awardFees));
    const cpm = miles > 0 ? ((cash - taxes) / miles) * 1000 : 0;
    const personal = Math.max(0, parse(personalCpm));
    const netSavings = cash - taxes - (miles * personal) / 1000;
    return { cpm, netSavings, cash, miles, taxes, personal };
  }, [cashFare, awardMiles, awardFees, personalCpm]);

  const sale = useMemo(() => {
    const miles = Math.max(0, parse(saleMiles));
    const acquisitionCpm = Math.max(0, parse(saleCpm));
    const grossSale = Math.max(0, parse(saleTotal));
    const fees = Math.max(0, parse(saleFees));
    const acquisitionCost = acquisitionCpm * miles / 1000;
    const netSale = grossSale - fees;
    const saleCpmValue = miles > 0 ? grossSale / miles * 1000 : 0;
    const netSaleCpm = miles > 0 ? netSale / miles * 1000 : 0;
    const gainPerThousand = netSaleCpm - acquisitionCpm;
    const finalCostPerThousand = miles > 0 ? (acquisitionCost + fees) / miles * 1000 : 0;
    const profit = netSale - acquisitionCost;
    return { miles, acquisitionCpm, acquisitionCost, grossSale, netSale, fees, saleCpmValue, netSaleCpm, gainPerThousand, finalCostPerThousand, profit, gainPercent: acquisitionCost > 0 ? profit / acquisitionCost * 100 : 0 };
  }, [saleCpm, saleMiles, saleTotal, saleFees]);

  const reset = () => {
    setPaid("0"); setFees("0"); setPoints("0");
    setOriginPoints("0"); setBonus("0"); setFirstTransferBonus("0"); setOriginCost("0"); setTransferFees("0");
    setCashFare("0"); setAwardMiles("0"); setAwardFees("0"); setPersonalCpm("0");
    setSaleCpm("0"); setSaleMiles("0"); setSaleTotal("0"); setSaleFees("0");
  };

  const tabs: { key: ToolKey; label: string; icon: typeof Calculator; description: string }[] = [
    { key: "milheiro", label: "Custo por milheiro", icon: Calculator, description: "Calcule quanto você efetivamente paga a cada mil pontos ou milhas." },
    { key: "transferencia", label: "Transferência bonificada", icon: ArrowLeftRight, description: "Estime o saldo final e o custo efetivo após aplicar o bônus de transferência." },
    { key: "resgate", label: "Resgate com Dinheiro ou Milhas", icon: Plane, description: "Compare o valor extraído no resgate com o custo que você atribui às suas milhas." },
    { key: "venda", label: "Venda de milhas", icon: Wallet, description: "Calcule custo final e percentual de ganho na venda de milhas." },
  ];

  return (
    <section className="space-y-6">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">FERRAMENTAS DE DECISÃO</div>
          <h1 className="page-title">Calculadoras<span className="gold-period">.</span></h1>
          <p className="page-subtitle">Compare custos, bônus e resgates com números transparentes — antes de tomar uma decisão.</p>
        </div>
      </div>

      <div role="tablist" aria-label="Ferramentas de cálculo" className="grid min-w-0 grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-sm sm:flex sm:gap-1 sm:p-1.5">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            id={`calculator-tab-${key}`}
            type="button"
            role="tab"
            aria-selected={active === key}
            aria-controls={`calculator-panel-${key}`}
            onClick={() => setActive(key)}
            className={`flex min-h-12 min-w-0 items-center justify-start gap-2 rounded-lg px-3 py-3 text-left text-sm font-semibold leading-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6a45c] sm:flex-1 sm:justify-center sm:whitespace-nowrap sm:px-3 sm:text-center ${active === key ? "bg-[#111b2b] text-[#f0d38e] shadow-sm" : "text-slate-600 hover:bg-[#f8f5ed] hover:text-slate-900"}`}
          >
            <Icon size={17} className="shrink-0" />
            <span className="min-w-0 sm:hidden">{key === "milheiro" ? "Milheiro" : key === "transferencia" ? "Transferência" : key === "resgate" ? "Resgate" : "Venda de milhas"}</span>
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      <div id={`calculator-panel-${active}`} role="tabpanel" aria-labelledby={`calculator-tab-${active}`} className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(280px,.8fr)]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-7">
          {active === "milheiro" ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Custo por milheiro</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">Inclua o desembolso e as taxas diretamente relacionadas à aquisição.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Valor pago" value={paid} onChange={setPaid} suffix="R$" hint="Informe quanto pagou para adquirir os pontos ou milhas, sem incluir as taxas abaixo." />
                <Field label="Taxas adicionais" value={fees} onChange={setFees} suffix="R$" hint="Inclua taxas cobradas diretamente nessa compra, como tarifas de serviço." />
                <Field label="Pontos ou milhas recebidos" value={points} onChange={setPoints} suffix="pts" hint="Digite a quantidade total creditada na operação." />
                <label className="block min-w-0 space-y-2 sm:col-span-2">
                  <span className="block text-sm font-medium text-slate-700">Programa de fidelidade</span>
                  <span className="block rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">Selecione o programa para consultar a referência de custo correspondente.</span>
                  <select value={program} onChange={(event) => setProgram(event.target.value as ProgramKey)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 focus:border-[#b9954d] focus:outline-none focus:ring-2 focus:ring-[#c6a45c]/20">
                    {Object.entries(MILEIRO_REFERENCES).map(([key, reference]) => <option key={key} value={key}>{reference.label}</option>)}
                  </select>
                </label>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Result label="Custo por milheiro" value={milheiro.qty > 0 ? currency(milheiro.cpm) : "—"} detail="Fórmula: (valor pago + taxas) ÷ quantidade × 1.000." />
                <Result label="Desembolso total" value={currency(milheiro.total)} detail={milheiro.qty > 0 ? `Quantidade considerada: ${number(milheiro.qty)} pontos.` : "Informe uma quantidade maior que zero para calcular o milheiro."} />
              </div>

              <div className={"mt-4 rounded-xl border p-4 " + (milheiro.qty <= 0 ? "border-slate-200 bg-slate-50" : milheiro.cpm < MILEIRO_REFERENCES[program].good ? "border-emerald-200 bg-emerald-50" : milheiro.cpm === MILEIRO_REFERENCES[program].good ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50")}>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-700">Seu resultado:</span>
                  <span className={"rounded-full px-3 py-1 text-sm font-semibold " + (milheiro.qty <= 0 ? "bg-slate-100 text-slate-600" : milheiro.cpm < MILEIRO_REFERENCES[program].good ? "bg-emerald-50 text-emerald-700" : milheiro.cpm === MILEIRO_REFERENCES[program].good ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700")}>
                    {milheiro.qty <= 0 ? "Informe a quantidade" : milheiro.cpm < MILEIRO_REFERENCES[program].good ? "Excelente" : milheiro.cpm === MILEIRO_REFERENCES[program].good ? "Bom" : "Ruim"}
                  </span>
                </div>
                <div className="font-semibold text-slate-900">Referência de custo — {MILEIRO_REFERENCES[program].label}</div>
                <p className="mt-1 text-sm leading-6 text-slate-600">Excelente: abaixo de {currency(MILEIRO_REFERENCES[program].good)} · Bom: {currency(MILEIRO_REFERENCES[program].good)} · Ruim: acima de {currency(MILEIRO_REFERENCES[program].good)} por milheiro.</p>
                <p className="mt-2 text-xs leading-5 text-slate-500">Referências iniciais informadas pela Fabricante de Milhas; não garantem rentabilidade. Avalie também disponibilidade e valor real de resgate.</p>
              </div>
            </>
          ) : active === "transferencia" ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Transferência bonificada</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">O custo informado deve representar o custo de aquisição dos pontos de origem, não o preço estimado das milhas finais.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Pontos transferidos" value={originPoints} onChange={setOriginPoints} suffix="pts" hint="Quantidade que sairá do programa de origem antes do bônus." />
                <Field label="Bônus de transferência" value={bonus} onChange={setBonus} suffix="%" hint="Informe o percentual anunciado, por exemplo, 80 para um bônus de 80%." />
                <Field label="Bônus de 1ª transferência" value={firstTransferBonus} onChange={setFirstTransferBonus} suffix="milhas extras" hint="Informe a quantidade fixa de milhas extras oferecidas por ser sua primeira transferência. Esse valor é somado após o bônus percentual." />
                <Field label="Custo dos pontos de origem" value={originCost} onChange={setOriginCost} suffix="R$" hint="Quanto custaram os pontos transferidos. Para pontos do cartão, estime seu custo real." />
                <Field label="Taxas da transferência" value={transferFees} onChange={setTransferFees} suffix="R$" hint="Inclua cobranças necessárias para concluir a transferência, se houver." />
                <label className="block min-w-0 space-y-2 sm:col-span-2">
                  <span className="block text-sm font-medium text-slate-700">Programa de destino</span>
                  <span className="block rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500">Escolha onde as milhas serão creditadas; a referência se ajusta ao programa.</span>
                  <select value={program} onChange={(event) => setProgram(event.target.value as ProgramKey)} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-base text-slate-900 focus:border-[#b9954d] focus:outline-none focus:ring-2 focus:ring-[#c6a45c]/20">
                    {Object.entries(MILEIRO_REFERENCES).map(([key, reference]) => <option key={key} value={key}>{reference.label}</option>)}
                  </select>
                </label>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Result label="Milhas finais estimadas" value={number(transfer.finalMiles)} detail="Considera o bônus percentual e as milhas extras da primeira transferência, quando informadas." />
                <Result label="Custo por milheiro final" value={transfer.finalMiles > 0 ? currency(transfer.cpm) : "—"} detail={`Custo total considerado: ${currency(transfer.totalCost)}.`} />
              </div>
              <div className={"mt-4 rounded-xl border p-4 " + (transfer.finalMiles <= 0 ? "border-slate-200 bg-slate-50" : transfer.cpm < MILEIRO_REFERENCES[program].good ? "border-emerald-200 bg-emerald-50" : transfer.cpm === MILEIRO_REFERENCES[program].good ? "border-amber-200 bg-amber-50" : "border-red-200 bg-red-50")}>
                <div className="font-semibold text-slate-900">Referência de custo — {MILEIRO_REFERENCES[program].label}</div>
                <p className="mt-1 text-sm leading-6 text-slate-600">Excelente: abaixo de {currency(MILEIRO_REFERENCES[program].good)} · Bom: {currency(MILEIRO_REFERENCES[program].good)} · Ruim: acima de {currency(MILEIRO_REFERENCES[program].good)} por milheiro final.</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-600">Seu resultado:</span>
                  <span className={"rounded-full px-3 py-1 text-sm font-semibold " + (transfer.finalMiles <= 0 ? "bg-slate-100 text-slate-600" : transfer.cpm < MILEIRO_REFERENCES[program].good ? "bg-emerald-50 text-emerald-700" : transfer.cpm === MILEIRO_REFERENCES[program].good ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700")}>
                    {transfer.finalMiles <= 0 ? "Informe os pontos transferidos" : transfer.cpm < MILEIRO_REFERENCES[program].good ? "Excelente" : transfer.cpm === MILEIRO_REFERENCES[program].good ? "Bom" : "Ruim"}
                  </span>
                </div>
                <p className="mt-2 text-xs leading-5 text-slate-500">A classificação considera o custo efetivo após o bônus e as taxas informadas. Referências iniciais da Fabricante de Milhas; não garantem rentabilidade.</p>
              </div>
            </>
          ) : active === "resgate" ? (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Resgate com Dinheiro ou Milhas</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">Compare o preço da passagem em dinheiro com o valor líquido coberto pelas milhas, descontando as taxas do resgate.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Preço em dinheiro" value={cashFare} onChange={setCashFare} suffix="R$" hint="Preço total de uma passagem equivalente, incluindo taxas e bagagem necessária." />
                <Field label="Milhas exigidas" value={awardMiles} onChange={setAwardMiles} suffix="milhas" hint="Total de milhas exigidas para os passageiros incluídos no preço em dinheiro." />
                <Field label="Taxas do resgate" value={awardFees} onChange={setAwardFees} suffix="R$" hint="Inclua taxas aeroportuárias e cobranças pagas à parte na emissão com milhas." />
                <Field label="Seu custo por milheiro" value={personalCpm} onChange={setPersonalCpm} suffix="R$/1.000" hint="Informe quanto você pagou efetivamente por cada 1.000 milhas. Considere o bônus de transferência e as taxas para calcular seu custo real." />

              </div>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Result label="Valor por milheiro no resgate" value={redemption.miles > 0 ? currency(redemption.cpm) : "—"} detail="Fórmula: (preço em dinheiro − taxas do resgate) ÷ milhas × 1.000." />
                <Result label="Economia líquida estimada" value={currency(redemption.netSavings)} detail={redemption.netSavings >= 0 ? "Positiva após descontar taxas e custo de oportunidade das milhas." : "Negativa: comprar a passagem em dinheiro pode ser financeiramente melhor, com estes valores."} />
              </div>
              <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-600">Valor do resgate versus seu custo:</span>
                  <span className={"rounded-full px-3 py-1 text-sm font-semibold " + (redemption.miles <= 0 ? "bg-slate-100 text-slate-600" : redemption.cpm > (Number(personalCpm) || 0) ? "bg-emerald-50 text-emerald-700" : redemption.cpm === (Number(personalCpm) || 0) ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700")}>
                    {redemption.miles <= 0 ? "Informe as milhas" : redemption.cpm > (Number(personalCpm) || 0) ? "Acima do seu custo" : redemption.cpm === (Number(personalCpm) || 0) ? "Igual ao seu custo" : "Abaixo do seu custo"}
                  </span>
                </div>
                {redemption.miles > 0 && redemption.netSavings < 0 && (
                  <div role="status" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium leading-5 text-red-800">
                    Resgate não vantajoso frente ao pagamento em dinheiro: a economia líquida estimada é negativa em {currency(Math.abs(redemption.netSavings))}.
                  </div>
                )}
                {redemption.miles > 0 && redemption.netSavings >= 0 && (
                  <div role="status" className="mt-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium leading-5 text-emerald-800">
                    O resgate apresenta economia líquida estimada positiva de {currency(redemption.netSavings)} frente ao pagamento em dinheiro.
                  </div>
                )}
                <p className="mt-2 text-xs leading-5 text-slate-500">A classificação compara o valor por milheiro obtido no resgate com seu custo efetivo informado. Considere também a economia líquida, disponibilidade e regras da passagem.</p>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Venda de milhas</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">Calcule o custo efetivo e o percentual de ganho na venda de pontos ou milhas.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Custo por milheiro" value={saleCpm} onChange={setSaleCpm} suffix="R$/1.000" hint="Custo efetivo de aquisição de cada 1.000 milhas." />
                <Field label="Quantidade de milhas vendidas" value={saleMiles} onChange={setSaleMiles} suffix="milhas" hint="Quantidade total de milhas incluída na venda." />
                <Field label="Valor total da venda" value={saleTotal} onChange={setSaleTotal} suffix="R$" hint="Valor bruto recebido pela venda, antes de taxas ou comissões." />
                <Field label="Taxas ou comissões" value={saleFees} onChange={setSaleFees} suffix="R$" hint="Custos diretamente relacionados à venda; serão descontados da receita." />
              </div>
              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Result label="Valor de venda por milheiro" value={sale.miles > 0 && sale.grossSale > 0 ? currency(sale.saleCpmValue) : "—"} detail="Valor bruto da venda dividido pela quantidade de milhas e multiplicado por 1.000." />
                <Result label="Ganho por milheiro" value={sale.miles > 0 && sale.acquisitionCpm > 0 && sale.grossSale > 0 ? currency(sale.gainPerThousand) : "—"} detail="Valor de venda por milheiro, descontando taxas por milheiro, menos o custo de aquisição." />
                <Result label="Custo de aquisição total" value={sale.miles > 0 && sale.acquisitionCpm > 0 ? currency(sale.acquisitionCost) : "—"} detail="Custo por milheiro multiplicado pela quantidade vendida." />
                <Result label="Percentual de ganho sobre o custo" value={sale.miles > 0 && sale.acquisitionCost > 0 && sale.grossSale > 0 ? number(sale.gainPercent) + "%" : "—"} detail="Lucro estimado após taxas dividido pelo custo de aquisição total." />
              </div>
              <div role="status" className={"mt-4 rounded-xl border p-4 " + (sale.acquisitionCost <= 0 || sale.miles <= 0 ? "border-slate-200 bg-slate-50 text-slate-700" : sale.profit > 0 ? "border-emerald-200 bg-emerald-50 text-emerald-800" : sale.profit === 0 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-red-200 bg-red-50 text-red-800")}>
                <div className="font-semibold">{sale.acquisitionCost <= 0 || sale.miles <= 0 ? "Informe os dados da operação" : sale.profit > 0 ? "Venda com ganho estimado" : sale.profit === 0 ? "Operação no ponto de equilíbrio" : "Atenção: venda com prejuízo estimado"}</div>
                <p className="mt-2 text-sm leading-6">{sale.acquisitionCost <= 0 || sale.miles <= 0 ? "Preencha custo por milheiro e quantidade de milhas para avaliar o resultado." : "Resultado após taxas: " + currency(sale.profit) + " (" + number(sale.gainPercent) + "% sobre o custo de aquisição)."}</p>
                <p className="mt-2 text-xs leading-5 opacity-80">O percentual é calculado sobre o custo de aquisição. Inclua todos os custos relevantes; o resultado é uma estimativa.</p>
              </div>
            </>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl bg-[#111b2b] p-5 text-white md:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#e0c47f]"><Info size={17} /> Como interpretar</div>
            {active === "milheiro" ? (
              <p className="mt-3 text-sm leading-6 text-slate-200">Um custo menor não significa automaticamente uma boa compra. Compare o resultado com o valor realista que você consegue obter ao resgatar e inclua custos indiretos relevantes.</p>
            ) : active === "transferencia" ? (
              <p className="mt-3 text-sm leading-6 text-slate-200">Bônus alto não garante uma boa operação. Verifique elegibilidade, prazo, validade das milhas, regras de estorno e se há taxa ou custo de oportunidade para transferir.</p>
            ) : active === "resgate" ? (
              <p className="mt-3 text-sm leading-6 text-slate-200">O resgate tende a ser mais interessante quando o valor por milheiro supera seu custo de aquisição ou o valor de uma alternativa viável. Considere bagagem, flexibilidade, disponibilidade e regras tarifárias.</p>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-200">O percentual de ganho é calculado sobre o custo de aquisição, descontando as taxas informadas. Inclua todos os custos relevantes da operação.</p>
            )}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900">Premissas importantes</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
              <li>Os cálculos usam apenas os valores informados nesta tela.</li>
              <li>Não há consulta automática de tarifas, promoções ou saldos.</li>
              <li>Arredondamentos são apenas de exibição; os cálculos usam os valores numéricos inseridos.</li>
            </ul>
          </div>
          <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6a45c]">
            <RotateCcw size={15} /> Restaurar valores de exemplo
          </button>
        </aside>
      </div>
    </section>
  );
}
