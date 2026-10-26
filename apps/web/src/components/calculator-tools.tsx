"use client";

import { useMemo, useState } from "react";
import { Calculator, ArrowLeftRight, Plane, RotateCcw, Info } from "lucide-react";

type ToolKey = "milheiro" | "transferencia" | "resgate";
type ProgramKey = "latam" | "smiles" | "azul";
const MILEIRO_REFERENCES: Record<ProgramKey, { label: string; good: number }> = { latam: { label: "LATAM Pass", good: 25 }, smiles: { label: "Smiles", good: 15 }, azul: { label: "Azul Fidelidade", good: 13 } };

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
  const [originCost, setOriginCost] = useState("0");
  const [transferFees, setTransferFees] = useState("0");
  const [cashFare, setCashFare] = useState("0");
  const [awardMiles, setAwardMiles] = useState("0");
  const [awardFees, setAwardFees] = useState("120");
  const [personalCpm, setPersonalCpm] = useState("0");

  const milheiro = useMemo(() => {
    const total = Math.max(0, parse(paid)) + Math.max(0, parse(fees));
    const qty = Math.max(0, parse(points));
    return { total, qty, cpm: qty > 0 ? (total / qty) * 1000 : 0 };
  }, [paid, fees, points]);

  const transfer = useMemo(() => {
    const qty = Math.max(0, parse(originPoints));
    const finalMiles = qty * (1 + Math.max(0, parse(bonus)) / 100);
    const totalCost = Math.max(0, parse(originCost)) + Math.max(0, parse(transferFees));
    return { finalMiles, totalCost, cpm: finalMiles > 0 ? (totalCost / finalMiles) * 1000 : 0 };
  }, [originPoints, bonus, originCost, transferFees]);

  const redemption = useMemo(() => {
    const cash = Math.max(0, parse(cashFare));
    const miles = Math.max(0, parse(awardMiles));
    const taxes = Math.max(0, parse(awardFees));
    const cpm = miles > 0 ? ((cash - taxes) / miles) * 1000 : 0;
    const personal = Math.max(0, parse(personalCpm));
    const netSavings = cash - taxes - (miles * personal) / 1000;
    return { cpm, netSavings, cash, miles, taxes, personal };
  }, [cashFare, awardMiles, awardFees, personalCpm]);

  const reset = () => {
    setPaid("0"); setFees("0"); setPoints("0");
    setOriginPoints("0"); setBonus("0"); setOriginCost("0"); setTransferFees("0");
    setCashFare("0"); setAwardMiles("0"); setAwardFees("120"); setPersonalCpm("0");
  };

  const tabs: { key: ToolKey; label: string; icon: typeof Calculator; description: string }[] = [
    { key: "milheiro", label: "Custo por milheiro", icon: Calculator, description: "Calcule quanto você efetivamente paga a cada mil pontos ou milhas." },
    { key: "transferencia", label: "Transferência bonificada", icon: ArrowLeftRight, description: "Estime o saldo final e o custo efetivo após aplicar o bônus de transferência." },
    { key: "resgate", label: "Dinheiro ou milhas", icon: Plane, description: "Compare o valor extraído no resgate com o custo que você atribui às suas milhas." },
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

      <div role="tablist" aria-label="Ferramentas de cálculo" className="flex min-w-0 gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            id={`calculator-tab-${key}`}
            type="button"
            role="tab"
            aria-selected={active === key}
            aria-controls={`calculator-panel-${key}`}
            onClick={() => setActive(key)}
            className={`flex min-w-0 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 py-3 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c6a45c] ${active === key ? "bg-[#111b2b] text-[#f0d38e] shadow-sm" : "text-slate-600 hover:bg-[#f8f5ed] hover:text-slate-900"}`}
          >
            <Icon size={17} className="shrink-0" />
            <span>{label}</span>
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
                <p className="mt-2 text-sm leading-6 text-slate-700">Referência para {MILEIRO_REFERENCES[program].label}: excelente abaixo de {currency(MILEIRO_REFERENCES[program].good)}, bom em {currency(MILEIRO_REFERENCES[program].good)} e ruim acima de {currency(MILEIRO_REFERENCES[program].good)} por milheiro.</p>
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
                <Result label="Milhas finais estimadas" value={number(transfer.finalMiles)} detail="Considera o bônus percentual aplicado aos pontos transferidos." />
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
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-slate-900">Dinheiro ou resgate com milhas</h2>
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
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl bg-[#111b2b] p-5 text-white md:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#e0c47f]"><Info size={17} /> Como interpretar</div>
            {active === "milheiro" ? (
              <p className="mt-3 text-sm leading-6 text-slate-200">Um custo menor não significa automaticamente uma boa compra. Compare o resultado com o valor realista que você consegue obter ao resgatar e inclua custos indiretos relevantes.</p>
            ) : active === "transferencia" ? (
              <p className="mt-3 text-sm leading-6 text-slate-200">Bônus alto não garante uma boa operação. Verifique elegibilidade, prazo, validade das milhas, regras de estorno e se há taxa ou custo de oportunidade para transferir.</p>
            ) : (
              <p className="mt-3 text-sm leading-6 text-slate-200">O resgate tende a ser mais interessante quando o valor por milheiro supera seu custo de aquisição ou o valor de uma alternativa viável. Considere bagagem, flexibilidade, disponibilidade e regras tarifárias.</p>
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
