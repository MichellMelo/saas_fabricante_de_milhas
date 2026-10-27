"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar, type DashboardRoute, type SidebarNavItem } from "@/components/dashboard-sidebar";
import { DashboardFooter } from "@/components/dashboard-footer";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowRight,
  Calculator,
  Clock3,
  CreditCard,
  LayoutDashboard,
  Plane,
  Plus,
  ShieldCheck,
  Sparkles,
  Star,
  Settings2,
  Users,
  MessageCircle,
  Video,
  GraduationCap,
  Wallet,
  TrendingUp,
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
import { MileFinanceDashboard } from "@/components/mile-finance-dashboard";
import { CalculatorTools } from "@/components/calculator-tools";
import { FlightHistory } from "@/components/flight-history";
import { FlightRecords } from "@/components/flight-records";

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
  { key: "mile-finance", label: "Financeiro de Milhas", icon: TrendingUp },
  { key: "calculadoras", label: "Calculadoras", icon: Calculator },
  { key: "passagens", label: "Passagens e resgates", icon: Plane, soon: true },
  { key: "historico", label: "Histórico de disponibilidades", icon: Clock3 },
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
  "mile-finance": {
    title: "Financeiro de Milhas",
    eyebrow: "COMPRAS, VENDAS E ESTOQUE",
    description: "Controle seu estoque de milhas, custo médio ponderado e resultado das operações.",
    icon: TrendingUp,
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
      "Calcule custo por milheiro, transferência bonificada e valor de resgate com fórmulas transparentes e dados informados por você.",
    icon: Calculator,
  },
  passagens: {
    title: "Passagens e resgates",
    eyebrow: "VIAGENS E RESGATES",
    description:
      "Organize informações de viagens e resgates. Este módulo ainda está planejado para uma próxima fase.",
    icon: Plane,
  },
  historico: {
    title: "Histórico de disponibilidades",
    eyebrow: "DISPONIBILIDADES PESQUISADAS",
    description: "Mantenha um histórico das disponibilidades encontradas por programa, rota, classe, piso de milhas e datas, como base para futuras emissões.",
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

type DashboardLoyaltyAccount = {
  id: string;
  balance: string | number;
  currency: string;
  loyaltyProgram: { id: string; name: string; type: "BANK" | "AIRLINE" | "HOTEL" | "OTHER" };
  _count?: { transactions: number };
};

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
  const [route, setRoute] = useState<RouteKey>(!user.isAdmin && !(user.productAccesses?.some((access) => access.active) ?? false) ? "calculadoras" : "dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarHidden] = useState(false);
  const [toast, setToast] = useState("");
  const [loyaltyAccounts, setLoyaltyAccounts] = useState<DashboardLoyaltyAccount[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");

  const hasAnyProduct = Boolean(user.productAccesses?.some((access) => access.active));
  const allowedNavItems = useMemo(() => user.isAdmin ? navItems : navItems.filter((item) => {
    if (item.key === "clientes-admin" || item.key === "financeiro" || item.key === "programas-admin") return false;
    if (!hasAnyProduct) return item.key === "calculadoras" || item.key === "programas" || item.key === "mile-finance";
    if (item.key === "grupo-vip") return user.productAccesses?.some((access) => access.product === "GROUP_VIP") ?? false;
    if (item.key === "auloes") return user.productAccesses?.some((access) => access.product === "AULAO") ?? false;
    if (item.key === "mentorias") return user.productAccesses?.some((access) => access.product === "MENTORSHIP") ?? false;
    return true;
  }), [user.isAdmin, hasAnyProduct, user.productAccesses]);

  useEffect(() => {
    let cancelled = false;
    async function loadDashboardData() {
      setDashboardLoading(true);
      setDashboardError("");
      try {
        const response = await fetch("/api/loyalty-accounts", { cache: "no-store" });
        const payload = await response.json().catch(() => []);
        if (!response.ok) {
          const message = Array.isArray(payload.message) ? payload.message.join(" ") : payload.message;
          throw new Error(message || "Não foi possível carregar seus saldos.");
        }
        if (!Array.isArray(payload)) throw new Error("A resposta de saldos está em formato inesperado.");
        if (!cancelled) setLoyaltyAccounts(payload as DashboardLoyaltyAccount[]);
      } catch (error) {
        if (!cancelled) setDashboardError(error instanceof Error ? error.message : "Não foi possível carregar seus saldos.");
      } finally {
        if (!cancelled) setDashboardLoading(false);
      }
    }
    void loadDashboardData();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const syncRouteFromHash = () => {
      const hash = window.location.hash.slice(1);
      const allowed = allowedNavItems.some((item) => item.key === hash);
      if (allowed) {
        setRoute(hash as RouteKey);
      } else if (!user.isAdmin && !hasAnyProduct) {
        setRoute("calculadoras");
        window.history.replaceState(null, "", window.location.pathname + "#calculadoras");
      } else if (hash) {
        setRoute("calculadoras");
        window.history.replaceState(null, "", window.location.pathname + "#calculadoras");
      }
    };
    syncRouteFromHash();
    window.addEventListener("hashchange", syncRouteFromHash);
    return () => window.removeEventListener("hashchange", syncRouteFromHash);
  }, [user.isAdmin, hasAnyProduct, allowedNavItems]);
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
  const pointAccounts = loyaltyAccounts.filter((account) => account.currency === "POINTS");
  const totalPoints = pointAccounts.reduce((sum, account) => sum + Number(account.balance || 0), 0);
  const programsCount = new Set(loyaltyAccounts.map((account) => account.loyaltyProgram.id)).size;
  const totalTransactions = loyaltyAccounts.reduce((sum, account) => sum + (account._count?.transactions ?? 0), 0);
  const numberFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 2 });
  const pointFormat = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

  return (
    <div className={`dashboard-shell${desktopSidebarCollapsed ? " sidebar-collapsed" : ""}`}>
      {mobileOpen && (
        <button
          className="fixed inset-0 z-20 bg-navy/40 md:hidden"
          aria-label="Fechar navegação"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <DashboardSidebar
        mobileOpen={mobileOpen}
        collapsed={desktopSidebarCollapsed}
        route={route}
        navItems={allowedNavItems}
        navigate={navigate}
        notify={notify}
      />
      <main className="main-area">
        <DashboardHeader
          title={route === "dashboard" ? "Visão geral" : routeCopy[route].title}
          mobileOpen={mobileOpen}
          onToggleMobile={() => setMobileOpen(!mobileOpen)}
          desktopSidebarCollapsed={desktopSidebarCollapsed}
          onToggleDesktopSidebar={() => setDesktopSidebarHidden((hidden) => !hidden)}
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
              {dashboardError && (
                <Alert role="alert" className="mb-5 border-red-200 bg-red-50 text-red-800">
                  <AlertDescription>{dashboardError}</AlertDescription>
                </Alert>
              )}
              <motion.section
                className="kpi-grid"
                aria-label="Indicadores reais da carteira"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.075, delayChildren: 0.12 } },
                }}
              >
                <StatCard
                  label="Total de pontos e milhas"
                  value={dashboardLoading ? "—" : pointFormat.format(totalPoints)}
                  suffix="pts"
                  icon={Star}
                  tone="icon-gold"
                  foot={<span>{dashboardLoading ? "Carregando saldos…" : `${pointAccounts.length} conta(s) com saldo em pontos`}</span>}
                />
                <StatCard
                  label="Valor estimado dos saldos"
                  value="—"
                  icon={CreditCard}
                  tone="icon-green"
                  foot={<span>Sem custo de aquisição suficiente para estimar com segurança</span>}
                />
                <StatCard
                  label="Programas acompanhados"
                  value={dashboardLoading ? "—" : String(programsCount).padStart(2, "0")}
                  suffix="programas"
                  icon={CreditCard}
                  tone="icon-blue"
                  foot={<span>{dashboardLoading ? "Carregando carteira…" : `${loyaltyAccounts.length} conta(s) cadastrada(s)`}</span>}
                />
                <StatCard
                  label="Movimentações registradas"
                  value={dashboardLoading ? "—" : pointFormat.format(totalTransactions)}
                  suffix="lançamentos"
                  icon={Sparkles}
                  tone="icon-purple"
                  foot={<span>Movimentações persistidas nas suas contas</span>}
                />
              </motion.section>
              <motion.section
                className="content-grid"
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Evolução dos saldos</h2>
                      <p>O histórico será exibido quando houver uma série temporal confiável.</p>
                    </div>
                  </div>
                  <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-5 py-8 text-center">
                    <div className="placeholder-mark"><Clock3 size={24} /></div>
                    {dashboardLoading ? (
                      <p className="text-sm text-slate-500">Carregando dados da carteira…</p>
                    ) : dashboardError ? (
                      <p className="text-sm text-slate-500">Não foi possível carregar o histórico agora.</p>
                    ) : totalTransactions === 0 ? (
                      <>
                        <h3 className="font-semibold text-slate-800">Ainda não há histórico de movimentações</h3>
                        <p className="max-w-md text-sm text-slate-500">Registre entradas, resgates ou ajustes em Programas e saldos para começar a acompanhar as movimentações.</p>
                        <Button variant="outline" onClick={() => navigate("programas")}>Registrar movimentação <ArrowRight size={14} /></Button>
                      </>
                    ) : (
                      <>
                        <h3 className="font-semibold text-slate-800">Há movimentações registradas</h3>
                        <p className="max-w-md text-sm text-slate-500">O saldo atual e a quantidade de lançamentos estão atualizados. Ainda não há uma consulta temporal integrada para reconstruir a evolução por período.</p>
                      </>
                    )}
                  </div>
                </Card>
                <Card className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Oportunidades em destaque</h2>
                      <p>Somente oportunidades reais e publicadas serão exibidas aqui.</p>
                    </div>
                    <Button variant="ghost" size="icon" aria-label="Ver oportunidades" onClick={() => navigate("oportunidades")}>
                      ···
                    </Button>
                  </div>
                  <div className="flex min-h-64 flex-col items-center justify-center gap-3 px-5 py-8 text-center">
                    <div className="placeholder-mark"><Sparkles size={24} /></div>
                    <h3 className="font-semibold text-slate-800">Nenhuma oportunidade publicada</h3>
                    <p className="max-w-md text-sm text-slate-500">A área de oportunidades ainda não possui um catálogo persistido conectado. Nenhuma oferta fictícia será apresentada como ativa.</p>
                    <Button variant="outline" onClick={() => navigate("oportunidades")}>Consultar oportunidades <ArrowRight size={14} /></Button>
                  </div>
                </Card>
              </motion.section>
              <motion.section
                className="bottom-grid"
                initial={reduceMotion ? false : { opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              >
                <Card className="panel">
                  <div className="panel-heading">
                    <div>
                      <h2>Distribuição por programa</h2>
                      <p>Composição calculada a partir dos saldos cadastrados.</p>
                    </div>
                    <button className="subtle-link" onClick={() => navigate("programas")}>Ver programas <ArrowRight size={13} /></button>
                  </div>
                  {dashboardLoading ? (
                    <p className="py-10 text-center text-sm text-slate-500">Carregando programas e saldos…</p>
                  ) : loyaltyAccounts.length === 0 ? (
                    <div className="flex flex-col items-center gap-3 py-10 text-center">
                      <div className="placeholder-mark"><CreditCard size={24} /></div>
                      <h3 className="font-semibold text-slate-800">Sua carteira ainda está vazia</h3>
                      <p className="max-w-sm text-sm text-slate-500">Adicione programas e informe os saldos para visualizar sua distribuição.</p>
                      <Button variant="outline" onClick={() => navigate("programas")}>Adicionar programa <ArrowRight size={14} /></Button>
                    </div>
                  ) : (
                    <div className="space-y-4 py-4">
                      {loyaltyAccounts.slice().sort((a, b) => Number(b.balance) - Number(a.balance)).map((account, index) => {
                        const balance = Number(account.balance || 0);
                        const share = totalPoints > 0 && account.currency === "POINTS" ? (balance / totalPoints) * 100 : 0;
                        const dotClasses = ["dot-one", "dot-two", "dot-three", "dot-four"];
                        return (
                          <div key={account.id} className="space-y-2">
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <span className="flex min-w-0 items-center gap-2 font-medium text-slate-700"><i className={"program-dot " + dotClasses[index % dotClasses.length]} /> <span className="truncate">{account.loyaltyProgram.name}</span></span>
                              <strong className="shrink-0 text-slate-800">{numberFormat.format(balance)} <small className="font-normal text-slate-500">{account.currency === "POINTS" ? "pts" : account.currency}</small></strong>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[#c6a45c]" style={{ width: `${Math.max(0, Math.min(100, share))}%` }} /></div>
                            <p className="text-right text-xs text-slate-500">{account.currency === "POINTS" && totalPoints > 0 ? `${share.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% do saldo em pontos` : "Saldo não comparável ao total em pontos"}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
                <Card className="quick-insight">
                  <div className="insight-header">
                    <Sparkles size={16} />
                    <span>INSIGHT DO PAINEL</span>
                    <Badge variant="gold" className="insight-demo">ORIENTAÇÃO</Badge>
                  </div>
                  <h2>Compare o custo antes de decidir.</h2>
                  <p>O saldo em pontos, sozinho, não determina o melhor resgate. Compare custo de aquisição, taxas e valor da passagem em dinheiro para avaliar o custo-benefício.</p>
                  <Button onClick={() => navigate("calculadoras")}><Calculator size={14} /> Abrir calculadoras <ArrowRight size={14} /></Button>
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
           ) : route === "passagens" ? (
            <ModulePlaceholder route="passagens" onBack={() => navigate("dashboard")} />
           ) : route === "historico" ? (
            <FlightHistory />
          ) : route === "calculadoras" ? (
            <CalculatorTools />
          ) : route === "mile-finance" ? (
            <MileFinanceDashboard />
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
            { key: "menu", label: "Mais", icon: Plus },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              type="button"
              className={`mobile-nav-item ${key === "menu" ? "mobile-nav-more" : route === key ? "is-active" : ""}`}
              onClick={() => key === "menu" ? setMobileOpen(true) : navigate(key)}
              aria-current={key !== "menu" && route === key ? "page" : undefined}
              aria-label={key === "menu" ? "Mais opções, abrir menu" : label}
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
