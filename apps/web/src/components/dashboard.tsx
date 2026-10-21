"use client";

import { useState, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bell,
  Calculator,
  ChevronDown,
  CircleHelp,
  Clock3,
  CreditCard,
  LayoutDashboard,
  Menu,
  Plane,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type RouteKey =
  | "dashboard"
  | "programas"
  | "calculadoras"
  | "passagens"
  | "historico";
const navItems: {
  key: RouteKey;
  label: string;
  icon: LucideIcon;
  soon?: boolean;
}[] = [
  { key: "dashboard", label: "Visão geral", icon: LayoutDashboard },
  {
    key: "programas",
    label: "Programas e saldos",
    icon: CreditCard,
    soon: true,
  },
  { key: "calculadoras", label: "Calculadoras", icon: Calculator, soon: true },
  { key: "passagens", label: "Passagens e resgates", icon: Plane, soon: true },
  { key: "historico", label: "Histórico", icon: Clock3, soon: true },
];
const routeCopy: Record<
  Exclude<RouteKey, "dashboard">,
  { title: string; eyebrow: string; description: string; icon: LucideIcon }
> = {
  programas: {
    title: "Programas e saldos",
    eyebrow: "PATRIMÔNIO DE PONTOS",
    description:
      "Centralize seus programas de fidelidade e acompanhe seus saldos. O cadastro e a persistência serão implementados em uma próxima fase.",
    icon: CreditCard,
  },
  calculadoras: {
    title: "Calculadoras",
    eyebrow: "DECISÕES COM NÚMEROS",
    description:
      "Compare custos, resgates e oportunidades antes de tomar uma decisão. As regras de cálculo serão implementadas e testadas antes de usar dados reais.",
    icon: Calculator,
  },
  passagens: {
    title: "Passagens e resgates",
    eyebrow: "VIAGENS E RESGATES",
    description:
      "Organize resgates e consulte o histórico das suas viagens. Ainda não há pesquisa de passagens nem integração com companhias aéreas.",
    icon: Plane,
  },
  historico: {
    title: "Histórico",
    eyebrow: "ACOMPANHAMENTO",
    description:
      "Tenha visibilidade das movimentações e decisões ao longo do tempo. Nenhuma movimentação é persistida nesta fase.",
    icon: Clock3,
  },
};
function Sparkline({ color = "#c6a45c" }: { color?: string }) {
  return (
    <svg
      viewBox="0 0 120 32"
      preserveAspectRatio="none"
      className="h-full w-full"
      aria-hidden="true"
    >
      <path
        d="M1 26 14 22 25 25 39 13 52 17 65 9 78 14 92 5 105 10 119 2"
        fill="none"
        stroke={color}
        strokeWidth="1.8"
      />
    </svg>
  );
}

async function handleLogout() {
  try {
    await fetch("/api/auth/logout", { method: "POST" });
  } finally {
    window.location.assign("/login");
  }
}

function StatCard({
  label,
  value,
  suffix,
  icon: Icon,
  tone,
  foot,
  spark,
  trend,
}: {
  label: string;
  value: string;
  suffix?: ReactNode;
  icon: LucideIcon;
  tone: string;
  foot: ReactNode;
  spark?: boolean;
  trend?: boolean;
}) {
  return (
    <Card className="kpi-card">
      <div className="kpi-top">
        <span className="kpi-label">{label}</span>
        <span className={"kpi-icon " + tone}>
          <Icon size={17} />
        </span>
      </div>
      <div className="kpi-value">
        {value} {suffix && <span className="unit">{suffix}</span>}
      </div>
      <div className="kpi-foot">{foot}</div>
      {spark && (
        <div className="kpi-spark">
          <Sparkline color={tone === "icon-green" ? "#68b49c" : "#c6a45c"} />
        </div>
      )}
      {trend && (
        <div className="opportunity-dots" aria-hidden="true">
          {Array.from({ length: 12 }, (_, i) => (
            <i key={i} className={i < 7 ? "active" : ""} />
          ))}
        </div>
      )}
    </Card>
  );
}

type DashboardUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
};

export function Dashboard({ user }: { user: DashboardUser }) {
  const [route, setRoute] = useState<RouteKey>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [period, setPeriod] = useState("30");
  const [toast, setToast] = useState("");
  const [updated, setUpdated] = useState(false);
  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 3200);
  }
  function navigate(next: RouteKey) {
    setRoute(next);
    setMobileOpen(false);
    window.history.replaceState(
      null,
      "",
      next === "dashboard" ? window.location.pathname : "#" + next,
    );
  }
  const chartLabels: Record<string, string[]> = {
    "7": ["12 out", "13 out", "14 out", "15 out", "16 out", "17 out", "18 out"],
    "30": [
      "19 set",
      "24 set",
      "29 set",
      "04 out",
      "09 out",
      "14 out",
      "18 out",
    ],
    "90": [
      "21 jul",
      "05 ago",
      "20 ago",
      "04 set",
      "19 set",
      "04 out",
      "18 out",
    ],
  };
  return (
    <div className="dashboard-shell">
      {mobileOpen && (
        <button
          className="fixed inset-0 z-20 bg-navy/40 md:hidden"
          aria-label="Fechar navegação"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={"sidebar " + (mobileOpen ? "is-open" : "")}
        aria-label="Navegação principal"
      >
        <button
          className="brand text-left"
          onClick={() => navigate("dashboard")}
          aria-label="Fabricante de Milhas, início"
        >
          <span className="brand-mark">
            <svg viewBox="0 0 40 40" width="35" height="35" fill="none">
              <path
                d="M8 25.5 15.5 10l5 10 4.2-6.5L32 25.5M8 30h24"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="28.8" cy="9.5" r="2.3" fill="currentColor" />
            </svg>
          </span>
          <span className="brand-copy">
            <strong>fabricante</strong>
            <span>DE MILHAS</span>
          </span>
        </button>
        <div className="workspace-label">ESPAÇO DE TRABALHO</div>
        <nav className="nav-list">
          {navItems.map(({ key, label, icon: Icon, soon }) => (
            <button
              key={key}
              className={"nav-item " + (route === key ? "is-active" : "")}
              onClick={() => navigate(key)}
              aria-current={route === key ? "page" : undefined}
            >
              <Icon size={18} />
              <span>{label}</span>
              {soon && <span className="nav-soon">EM BREVE</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <CircleHelp size={18} className="help-icon" />
            <div>
              <strong>Precisa de ajuda?</strong>
              <p>Entenda como usar seu painel.</p>
              <button
                className="text-link"
                onClick={() =>
                  notify(
                    "Dica: compare custo por milheiro, taxas e valor real do resgate antes de decidir.",
                  )
                }
              >
                Ver guia rápido ↗
              </button>
            </div>
          </div>
          <div className="sidebar-footer">
            <span className="status-dot" /> Ambiente de demonstração{" "}
            <span className="version">v0.2</span>
          </div>
        </div>
      </aside>
      <main className="main-area">
        <header className="topbar">
          <Button
            variant="ghost"
            size="icon"
            className="menu-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Fechar navegação" : "Abrir navegação"}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </Button>
          <div className="breadcrumbs">
            <span>Workspace</span>
            <span className="text-slate-300">/</span>
            <strong>
              {route === "dashboard" ? "Visão geral" : routeCopy[route].title}
            </strong>
          </div>
          <div className="topbar-actions">
            <Badge variant="gold" className="demo-pill">
              <span /> DEMONSTRAÇÃO
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Ver notificações"
              className="relative"
              onClick={() =>
                notify(
                  "Você está em um ambiente de demonstração. Não há notificações reais.",
                )
              }
            >
              <Bell size={18} />
              <i className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full border border-white bg-gold" />
            </Button>
            <div className="profile-chip">
              <span className="avatar">FM</span>
              <span className="profile-name">
                {user.name?.trim() || user.email}
              </span>
              <ChevronDown size={13} className="chevron" />
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
            >
              Sair
            </button>
          </div>
        </header>
        <div className="page-content">
          {route === "dashboard" ? (
            <>
              <section className="welcome-row">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-line" /> PAINEL EXECUTIVO
                  </div>
                  <h1 className="page-title">
                    Visão geral<span className="gold-period">.</span>
                  </h1>
                  <p className="page-subtitle">
                    Uma visão clara dos seus pontos, milhas e próximas
                    oportunidades.
                  </p>
                </div>
                <div className="welcome-actions">
                  <span className="updated-label">
                    <span className="live-dot" />
                    {updated ? "Conferido agora" : "Dados ilustrativos"}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUpdated(true);
                      notify(
                        "Painel demonstrativo atualizado. Nenhum dado externo foi consultado.",
                      );
                    }}
                  >
                    <RefreshCw size={14} /> Atualizar painel
                  </Button>
                </div>
              </section>
              <div className="demo-notice">
                <ShieldCheck size={16} className="shrink-0" />
                <span>
                  <strong>Ambiente de demonstração.</strong> Os saldos, valores
                  e oportunidades abaixo são fictícios e servem apenas para
                  apresentar a interface.
                </span>
              </div>
              <section className="kpi-grid" aria-label="Indicadores principais">
                <StatCard
                  label="Total de pontos e milhas"
                  value="248.650"
                  suffix="pts"
                  icon={Star}
                  tone="icon-gold"
                  spark
                  foot={
                    <>
                      <span className="trend-up flex items-center gap-1">
                        <ArrowUpRight size={12} /> 8,4%
                      </span>
                      <span>vs. período anterior</span>
                    </>
                  }
                />
                <StatCard
                  label="Valor estimado dos saldos"
                  value="R$ 6.840"
                  suffix={<span className="decimal">,00</span>}
                  icon={CreditCard}
                  tone="icon-green"
                  spark
                  foot={
                    <>
                      <span className="neutral-chip">Estimativa</span>
                      <span>por custo de aquisição</span>
                    </>
                  }
                />
                <StatCard
                  label="Programas acompanhados"
                  value="04"
                  suffix="programas"
                  icon={CreditCard}
                  tone="icon-blue"
                  foot={
                    <>
                      <span className="neutral-chip">2 nacionais</span>
                      <span>+ 2 internacionais</span>
                    </>
                  }
                />
                <StatCard
                  label="Oportunidades mapeadas"
                  value="12"
                  suffix="ativas"
                  icon={Sparkles}
                  tone="icon-purple"
                  trend
                  foot={
                    <>
                      <span className="trend-up flex items-center gap-1">
                        <ArrowUpRight size={12} /> 3 novas
                      </span>
                      <span>nesta semana</span>
                    </>
                  }
                />
              </section>
              <section className="content-grid">
                <Card className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Evolução dos saldos</h2>
                      <p>Acompanhe a variação do seu patrimônio em pontos.</p>
                    </div>
                    <label>
                      <span className="sr-only">Período do gráfico</span>
                      <select
                        className="period-select"
                        value={period}
                        onChange={(event) => {
                          setPeriod(event.target.value);
                          notify(
                            "Período alterado. A curva continua ilustrativa nesta versão.",
                          );
                        }}
                      >
                        <option value="30">Últimos 30 dias</option>
                        <option value="7">Últimos 7 dias</option>
                        <option value="90">Últimos 90 dias</option>
                      </select>
                    </label>
                  </div>
                  <div className="chart-legend">
                    <span>
                      <i className="legend-dot" /> Saldo total
                    </span>
                    <span className="chart-current">
                      248.650 pts <b>+8,4%</b>
                    </span>
                  </div>
                  <div className="chart-wrap">
                    <div className="chart-y-labels" aria-hidden="true">
                      <span>260k</span>
                      <span>240k</span>
                      <span>220k</span>
                      <span>200k</span>
                      <span>180k</span>
                    </div>
                    <svg
                      className="balance-chart"
                      viewBox="0 0 640 220"
                      role="img"
                      aria-label="Gráfico ilustrativo de evolução crescente do saldo total em pontos"
                    >
                      <defs>
                        <linearGradient
                          id="chart-fill"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="0%"
                            stopColor="#c6a45c"
                            stopOpacity=".24"
                          />
                          <stop
                            offset="100%"
                            stopColor="#c6a45c"
                            stopOpacity="0"
                          />
                        </linearGradient>
                      </defs>
                      <g className="chart-grid">
                        <path d="M0 20H640M0 62H640M0 104H640M0 146H640M0 188H640" />
                      </g>
                      <path
                        className="chart-area"
                        d="M0 165 C24 158 32 166 56 148 S92 150 112 132 S148 138 170 112 S208 126 228 103 S263 108 286 87 S320 100 342 77 S378 88 399 66 S432 79 454 58 S487 71 510 49 S546 56 568 39 S608 44 640 19 L640 202 L0 202Z"
                      />
                      <path
                        className="chart-line"
                        d="M0 165 C24 158 32 166 56 148 S92 150 112 132 S148 138 170 112 S208 126 228 103 S263 108 286 87 S320 100 342 77 S378 88 399 66 S432 79 454 58 S487 71 510 49 S546 56 568 39 S608 44 640 19"
                      />
                      <circle className="chart-point" cx="640" cy="19" r="5" />
                    </svg>
                  </div>
                  <div className="chart-x-labels">
                    {chartLabels[period].map((label) => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>
                  <div className="panel-note">
                    <ShieldCheck size={13} /> Gráfico ilustrativo. A integração
                    de saldos será definida em uma fase futura.
                  </div>
                </Card>
                <Card className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Oportunidades em destaque</h2>
                      <p>Exemplos de decisões que o painel poderá apoiar.</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Ver todas as oportunidades"
                      onClick={() =>
                        notify(
                          "A lista completa de oportunidades fará parte de uma próxima fase.",
                        )
                      }
                    >
                      ···
                    </Button>
                  </div>
                  <div className="opportunity-list">
                    <div className="opportunity-item">
                      <div className="opportunity-brand brand-smile">S</div>
                      <div className="opportunity-copy">
                        <strong>Bônus de transferência</strong>
                        <span>Programa A → Companhia aérea</span>
                        <small>
                          <i className="tag tag-green">TRANSFERÊNCIA</i>
                          <b>Exemplo</b>
                        </small>
                      </div>
                      <div className="opportunity-value">
                        <strong>+80%</strong>
                        <span>de bônus</span>
                      </div>
                    </div>
                    <div className="opportunity-item">
                      <div className="opportunity-brand brand-points">P</div>
                      <div className="opportunity-copy">
                        <strong>Compra de pontos</strong>
                        <span>Clube de pontos</span>
                        <small>
                          <i className="tag tag-blue">COMPRA</i>
                          <b>Exemplo</b>
                        </small>
                      </div>
                      <div className="opportunity-value">
                        <strong>R$ 21,00</strong>
                        <span>por milheiro</span>
                      </div>
                    </div>
                    <div className="opportunity-item">
                      <div className="opportunity-brand brand-flight">
                        <Plane size={17} />
                      </div>
                      <div className="opportunity-copy">
                        <strong>Resgate internacional</strong>
                        <span>Trecho de longa distância</span>
                        <small>
                          <i className="tag tag-gold">RESGATE</i>
                          <b>Exemplo</b>
                        </small>
                      </div>
                      <div className="opportunity-value">
                        <strong>62 mil</strong>
                        <span>pontos + taxas</span>
                      </div>
                    </div>
                  </div>
                  <button
                    className="panel-footer-link"
                    onClick={() =>
                      notify(
                        "As oportunidades exibidas são exemplos fictícios, sem ofertas vigentes.",
                      )
                    }
                  >
                    Explorar oportunidades <ArrowRight size={15} />
                  </button>
                </Card>
              </section>
              <section className="bottom-grid">
                <Card className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Distribuição por programa</h2>
                      <p>Composição ilustrativa dos saldos cadastrados.</p>
                    </div>
                    <button
                      className="subtle-link"
                      onClick={() => navigate("programas")}
                    >
                      Ver programas <ArrowRight size={13} />
                    </button>
                  </div>
                  <div className="program-content">
                    <div className="donut-wrap">
                      <div className="donut-chart">
                        <div className="donut-center">
                          <strong>248,6k</strong>
                          <span>pontos totais</span>
                        </div>
                      </div>
                    </div>
                    <div className="program-legend">
                      {[
                        ["Programa A", "42%", "104.433", "dot-one"],
                        ["Programa B", "28%", "69.622", "dot-two"],
                        ["Programa C", "18%", "44.757", "dot-three"],
                        ["Programa D", "12%", "29.838", "dot-four"],
                      ].map(([name, percent, points, dot]) => (
                        <div key={name}>
                          <span className="program-name">
                            <i className={"program-dot " + dot} />
                            {name}
                          </span>
                          <strong>
                            {percent}
                            <small>{points}</small>
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
                <Card className="quick-insight">
                  <div className="insight-header">
                    <Sparkles size={16} />
                    <span>INSIGHT DO PAINEL</span>
                    <Badge variant="gold" className="insight-demo">
                      ILUSTRATIVO
                    </Badge>
                  </div>
                  <h2>O custo por milheiro muda a decisão.</h2>
                  <p>
                    Antes de comprar ou transferir pontos, compare o custo total
                    com o valor que você consegue extrair no resgate — incluindo
                    taxas e oportunidade perdida.
                  </p>
                  <Button onClick={() => navigate("calculadoras")}>
                    <Calculator size={14} /> Conhecer calculadoras{" "}
                    <ArrowRight size={14} />
                  </Button>
                </Card>
              </section>
              <footer className="page-footer">
                <span>© 2026 Fabricante de Milhas</span>
                <span>Construído para decisões mais inteligentes.</span>
                <button
                  onClick={() =>
                    notify(
                      "Esta versão não coleta nem armazena dados pessoais.",
                    )
                  }
                >
                  Privacidade e segurança
                </button>
              </footer>
            </>
          ) : (
            <ModulePlaceholder
              route={route}
              onBack={() => navigate("dashboard")}
            />
          )}
        </div>
      </main>
      {toast && (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      )}
    </div>
  );
}
function ModulePlaceholder({
  route,
  onBack,
}: {
  route: Exclude<RouteKey, "dashboard">;
  onBack: () => void;
}) {
  const item = routeCopy[route];
  const Icon = item.icon;
  return (
    <section className="module-placeholder">
      <div className="placeholder-mark">
        <Icon size={25} />
      </div>
      <div className="eyebrow justify-center">
        <span className="eyebrow-line" />
        {item.eyebrow}
      </div>
      <h1 className="page-title">{item.title}</h1>
      <p>{item.description}</p>
      <Badge variant="gold" className="mb-5">
        Planejado para próxima fase
      </Badge>
      <div>
        <Button onClick={onBack}>
          <ArrowRight size={14} className="rotate-180" /> Voltar à visão geral
        </Button>
      </div>
    </section>
  );
}
