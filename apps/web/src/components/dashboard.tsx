"use client";

import { useEffect, useState, type ReactNode } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar, type DashboardRoute, type SidebarNavItem } from "@/components/dashboard-sidebar";
import { DashboardFooter } from "@/components/dashboard-footer";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  ArrowUpRight,
  Calculator,
  Clock3,
  CreditCard,
  LayoutDashboard,
  Plane,
  ShieldCheck,
  Sparkles,
  Star,
  Settings2,
  Users,
  MessageCircle,
  Video,
  GraduationCap,
  Wallet,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoyaltyAccounts } from "@/components/loyalty-accounts";
import { ProgramManagement } from "@/components/program-management";
import { ClientManagement } from "@/components/client-management";
import { GroupVipContent } from "@/components/group-vip-content";
import { ProductContent } from "@/components/product-content";
import { FinanceDashboard } from "@/components/finance-dashboard";

type RouteKey = DashboardRoute;
const navItems: SidebarNavItem[] = [
  { key: "dashboard", label: "Visão geral", icon: LayoutDashboard },
  { key: "oportunidades", label: "Oportunidades", icon: Sparkles },
  { key: "aprender", label: "Aprender", icon: GraduationCap },
  {
    key: "programas",
    label: "Programas e saldos",
    icon: CreditCard,
  },
  { key: "programas-admin", label: "Cadastro de programas", icon: Settings2 },
  { key: "clientes-admin", label: "Clientes e produtos", icon: Users },
  { key: "financeiro", label: "Financeiro", icon: Wallet },
  { key: "calculadoras", label: "Calculadoras", icon: Calculator, soon: true },
  { key: "passagens", label: "Passagens e resgates", icon: Plane, soon: true },
  { key: "historico", label: "Histórico", icon: Clock3, soon: true },
];
const routeCopy: Record<
  Exclude<RouteKey, "dashboard">,
  { title: string; eyebrow: string; description: string; icon: LucideIcon }
> = {
  oportunidades: {
    title: "Oportunidades",
    eyebrow: "OFERTAS ESTRATÉGICAS",
    description: "Consulte oportunidades publicadas, avalie as regras e acesse a fonte original antes de tomar uma decisão.",
    icon: Sparkles,
  },
  aprender: {
    title: "Aprender",
    eyebrow: "CONTEÚDO EDUCACIONAL",
    description: "Acesse Aulões, Mentorias e materiais liberados para seus produtos.",
    icon: GraduationCap,
  },
  programas: {
    title: "Programas e saldos",
    eyebrow: "PATRIMÔNIO DE PONTOS",
    description:
      "Centralize seus programas de fidelidade e acompanhe seus saldos. O cadastro e a persistência serão implementados em uma próxima fase.",
    icon: CreditCard,
  },
  "programas-admin": {
    title: "Cadastro de programas",
    eyebrow: "CATÁLOGO E PERSONALIZAÇÃO",
    description: "Gerencie programas do catálogo geral (com permissão administrativa) e crie programas personalizados para sua carteira.",
    icon: Settings2,
  },
  "clientes-admin": {
    title: "Clientes e produtos",
    eyebrow: "GESTÃO DE ACESSOS",
    description: "Convide clientes e gerencie o acesso ao Grupo VIP, aulões e mentorias.",
    icon: Users,
  },
  financeiro: {
    title: "Financeiro",
    eyebrow: "CONTROLE DE RECEBIMENTOS",
    description: "Acompanhe recebimentos, cobranças pendentes e valores vencidos.",
    icon: Wallet,
  },
  "grupo-vip": {
    title: "Grupo VIP",
    eyebrow: "CONTEÚDO EXCLUSIVO",
    description: "Publicações e materiais exclusivos para membros com acesso ativo.",
    icon: MessageCircle,
  },
  auloes: {
    title: "Aulões",
    eyebrow: "AULAS E MATERIAIS",
    description: "Acesse gravações, materiais e orientações dos aulões disponíveis para sua conta.",
    icon: Video,
  },
  mentorias: {
    title: "Mentorias",
    eyebrow: "ACOMPANHAMENTO EXCLUSIVO",
    description: "Consulte materiais, orientações e links disponibilizados para sua mentoria.",
    icon: GraduationCap,
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
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
    >
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
    </motion.div>
  );
}

type DashboardUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  isAdmin?: boolean;
  productAccesses?: { product: "GROUP_VIP" | "AULAO" | "MENTORSHIP"; active: boolean; startsAt: string; expiresAt: string | null }[];
};

export function Dashboard({ user }: { user: DashboardUser }) {
  const reduceMotion = useReducedMotion();
  const [route, setRoute] = useState<RouteKey>("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [period, setPeriod] = useState("30");
  const [toast, setToast] = useState("");
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    const syncRouteFromHash = () => {
      const hash = window.location.hash.slice(1);
      if (navItems.some((item) => item.key === hash)) {
        setRoute(hash as RouteKey);
      }
    };
    syncRouteFromHash();
    window.addEventListener("hashchange", syncRouteFromHash);
    return () => window.removeEventListener("hashchange", syncRouteFromHash);
  }, []);
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
      <DashboardSidebar
        mobileOpen={mobileOpen}
        route={route}
        navItems={user.isAdmin ? navItems : navItems.filter((item) => {
          if (item.key === "clientes-admin" || item.key === "financeiro" || item.key === "programas-admin") return false;
          if (item.key === "grupo-vip") return user.productAccesses?.some((access) => access.product === "GROUP_VIP") ?? false;
          if (item.key === "auloes") return user.productAccesses?.some((access) => access.product === "AULAO") ?? false;
          if (item.key === "mentorias") return user.productAccesses?.some((access) => access.product === "MENTORSHIP") ?? false;
          return true;
        })}
        navigate={navigate}
        notify={notify}
      />
      <main className="main-area">
        <DashboardHeader
          title={route === "dashboard" ? "Visão geral" : routeCopy[route].title}
          mobileOpen={mobileOpen}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
          notify={notify}
          user={user}
          onLogout={handleLogout}
        />
        <motion.div
          className="page-content"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
        >
          {route === "dashboard" ? (
            <>
              <motion.section
                className="welcome-row"
                initial={reduceMotion ? false : { opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              >
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
              </motion.section>
              <motion.div
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.4 }}
              >
                <Alert className="demo-notice">
                  <ShieldCheck size={16} className="shrink-0" />
                  <AlertDescription>
                    <strong>AMBIENTE DE DEMONSTRAÇÃO.</strong> Os saldos, valores
                    e oportunidades abaixo são fictícios e servem apenas para
                    apresentar a interface.
                  </AlertDescription>
                </Alert>
              </motion.div>
              <motion.section
                className="kpi-grid"
                aria-label="Indicadores principais"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: reduceMotion ? 0 : 0.075,
                      delayChildren: 0.12,
                    },
                  },
                }}
              >
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
              </motion.section>
              <motion.section
                className="content-grid"
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.24,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
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
                      onClick={() => navigate("oportunidades")}
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
                    onClick={() => navigate("oportunidades")}
                  >
                    Explorar oportunidades <ArrowRight size={15} />
                  </button>
                </Card>
              </motion.section>
              <motion.section
                className="bottom-grid"
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.32,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
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
              </motion.section>
              <DashboardFooter reduceMotion={reduceMotion} notify={notify} />
            </>
          ) : route === "oportunidades" ? (
            <OpportunityCenter />
          ) : route === "aprender" ? (
            <LearningHub navigate={navigate} user={user} />
          ) : route === "programas" ? (
            <LoyaltyAccounts onBack={() => navigate("dashboard")} />
          ) : route === "programas-admin" ? (
            <ProgramManagement onBack={() => navigate("dashboard")} />
          ) : route === "clientes-admin" ? (
            <ClientManagement onBack={() => navigate("dashboard")} />
          ) : route === "financeiro" ? (
            user.isAdmin ? <FinanceDashboard /> : <ModulePlaceholder route="historico" onBack={() => navigate("dashboard")} />
          ) : route === "grupo-vip" ? (
            <GroupVipContent isAdmin={Boolean(user.isAdmin)} />
          ) : route === "auloes" ? (
            <ProductContent isAdmin={Boolean(user.isAdmin)} product="AULAO" />
          ) : route === "mentorias" ? (
            <ProductContent isAdmin={Boolean(user.isAdmin)} product="MENTORSHIP" />
          ) : (
            <ModulePlaceholder
              route={route}
              onBack={() => navigate("dashboard")}
            />
          )}
        </motion.div>
      </main>
      {!mobileOpen && (
        <nav className="mobile-bottom-nav" aria-label="Navegação principal">
          {([
            { key: "dashboard", label: "Início", icon: LayoutDashboard },
            { key: "oportunidades", label: "Oportunidades", icon: Sparkles },
            { key: "programas", label: "Meus Pontos", icon: CreditCard },
            { key: "grupo-vip", label: "Comunidade", icon: MessageCircle },
            { key: "aprender", label: "Aprender", icon: GraduationCap },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              className={`mobile-nav-item ${route === key ? "is-active" : ""}`}
              onClick={() => navigate(key)}
              aria-current={route === key ? "page" : undefined}
            >
              <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      )}
      <AnimatePresence>
        {toast && (
          <motion.div
            className="toast"
            role="status"
            aria-live="polite"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18 }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
function OpportunityCenter() {
  return (
    <section className="space-y-6">
      <div className="welcome-row">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> OFERTAS ESTRATÉGICAS</div>
          <h1 className="page-title">Oportunidades<span className="gold-period">.</span></h1>
          <p className="page-subtitle">Avalie regras, restrições, validade e fonte original antes de agir.</p>
        </div>
      </div>
      <Alert className="demo-notice">
        <ShieldCheck size={16} className="shrink-0" />
        <AlertDescription>
          <strong>Somente ofertas verificadas.</strong> Esta área ainda não está conectada a um catálogo de oportunidades; nenhuma oferta fictícia será apresentada como vigente.
        </AlertDescription>
      </Alert>
      <Card className="panel opportunity-empty-state">
        <div className="placeholder-mark"><Sparkles size={25} /></div>
        <h2>Nenhuma oportunidade publicada</h2>
        <p>Quando houver ofertas cadastradas, você poderá abrir os detalhes, consultar regras e restrições, conferir a validade e acessar a fonte original.</p>
        <Badge variant="gold">Aguardando publicação</Badge>
      </Card>
    </section>
  );
}

function LearningHub({ navigate, user }: { navigate: (route: DashboardRoute) => void; user: DashboardUser }) {
  const hasAccess = (product: "GROUP_VIP" | "AULAO" | "MENTORSHIP") =>
    Boolean(user.isAdmin || user.productAccesses?.some((access) => access.product === product && access.active));
  const cards = [
    { product: "GROUP_VIP" as const, title: "Grupo VIP", description: "Publicações, materiais e conteúdos exclusivos da comunidade.", icon: MessageCircle, route: "grupo-vip" as const, action: "Acessar Grupo VIP" },
    { product: "AULAO" as const, title: "Aulões", description: "Gravações, materiais e orientações dos aulões disponíveis para você.", icon: Video, route: "auloes" as const, action: "Acessar Aulões" },
    { product: "MENTORSHIP" as const, title: "Mentorias", description: "Materiais, orientações e links liberados para sua mentoria.", icon: GraduationCap, route: "mentorias" as const, action: "Acessar Mentorias" },
  ].filter((card) => hasAccess(card.product));
  return (
    <section className="space-y-6">
      <div className="welcome-row">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> CONTEÚDO EDUCACIONAL</div>
          <h1 className="page-title">Aprender<span className="gold-period">.</span></h1>
          <p className="page-subtitle">Grupo VIP, Aulões e Mentorias em um só lugar. Os conteúdos exibidos respeitam os acessos liberados para sua conta.</p>
        </div>
      </div>
      {cards.length ? <div className="learning-hub-grid">
        {cards.map(({ title, description, icon: Icon, route, action }) => (
          <Card key={route} className="panel learning-hub-card">
            <div className="placeholder-mark"><Icon size={24} /></div>
            <h2>{title}</h2>
            <p>{description}</p>
            <Button onClick={() => navigate(route)}>{action} <ArrowRight size={14} /></Button>
          </Card>
        ))}
      </div> : <Card className="panel opportunity-empty-state">
        <div className="placeholder-mark"><GraduationCap size={25} /></div>
        <h2>Nenhum conteúdo liberado</h2>
        <p>Quando um produto for associado à sua conta, ele aparecerá aqui.</p>
      </Card>}
    </section>
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
