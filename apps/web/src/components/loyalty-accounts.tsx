"use client";

import { PageHeader } from "@/components/page-header";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Plane,
  Plus,
  Trash2,
  WalletCards,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Program = {
  id: string;
  name: string;
  code: string;
  type: "BANK" | "AIRLINE" | "HOTEL" | "OTHER";
};
type Account = {
  id: string;
  balance: string | number;
  currency: string;
  memberReference: string | null;
  updatedAt: string;
  loyaltyProgram: Program;
  _count?: { transactions: number };
};
type TransactionType =
  | "EARN"
  | "TRANSFER_IN"
  | "TRANSFER_OUT"
  | "REDEMPTION"
  | "PURCHASE"
  | "EXPIRATION"
  | "ADJUSTMENT";

const transactionOptions: Array<{ value: TransactionType; label: string }> = [
  { value: "EARN", label: "Acúmulo" },
  { value: "TRANSFER_IN", label: "Transferência recebida" },
  { value: "TRANSFER_OUT", label: "Transferência enviada" },
  { value: "REDEMPTION", label: "Resgate" },
  { value: "PURCHASE", label: "Compra de pontos" },
  { value: "EXPIRATION", label: "Expiração" },
  { value: "ADJUSTMENT", label: "Ajuste de saldo" },
];

const numberFormat = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 2,
});
const typeLabel: Record<Program["type"], string> = {
  BANK: "Banco / pontos",
  AIRLINE: "Companhia aérea",
  HOTEL: "Hotel",
  OTHER: "Outro",
};

const programIcon: Record<string, string> = {
  ESFERA: "/program-icons/esfera.png",
  LIVELO: "/program-icons/livelo.png",
  SMILES: "/program-icons/smiles.png",
  LATAM_PASS: "/program-icons/latam.png",
  AZUL_FIDELIDADE: "/program-icons/azul.png",
};

function ProgramMark({ program }: { program: Program }) {
  const icon = programIcon[program.code.toUpperCase()];
  return (
    <div
      aria-label={program.name}
      title={program.name}
      className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white p-1.5"
    >
      {icon ? (
        <img
          src={icon}
          alt={program.name}
          className="size-full object-contain"
        />
      ) : program.type === "AIRLINE" ? (
        <Plane size={25} strokeWidth={1.8} className="text-slate-600" />
      ) : program.type === "HOTEL" ? (
        <Building2 size={25} strokeWidth={1.8} className="text-slate-600" />
      ) : (
        <WalletCards size={25} strokeWidth={1.8} className="text-slate-600" />
      )}
    </div>
  );
}

function formatPoints(value: string | number) {
  return numberFormat.format(Number(value));
}

async function readResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(payload.message)
      ? payload.message.join(" ")
      : payload.message;
    throw new Error(message || "Não foi possível concluir a operação.");
  }
  return payload;
}

export function LoyaltyAccounts({ onBack }: { onBack: () => void }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingAccountId, setDeletingAccountId] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [programId, setProgramId] = useState("");
  const [memberReference, setMemberReference] = useState("");
  const [initialBalance, setInitialBalance] = useState("0");
  const [transactionAccount, setTransactionAccount] = useState("");
  const [transactionType, setTransactionType] =
    useState<TransactionType>("EARN");
  const [points, setPoints] = useState("");
  const [notes, setNotes] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [programResponse, accountResponse] = await Promise.all([
        fetch("/api/loyalty-programs", { cache: "no-store" }),
        fetch("/api/loyalty-accounts", { cache: "no-store" }),
      ]);
      const [programData, accountData] = await Promise.all([
        readResponse(programResponse),
        readResponse(accountResponse),
      ]);
      setPrograms(programData as Program[]);
      setAccounts(accountData as Account[]);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Erro ao carregar programas e saldos.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function createAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!programId) {
      setError("Selecione um programa de fidelidade.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await readResponse(
        await fetch("/api/loyalty-accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            loyaltyProgramId: programId,
            memberReference: memberReference.trim() || undefined,
            initialBalance: Number(initialBalance || 0),
          }),
        }),
      );
      setSuccess("Programa adicionado à sua carteira.");
      setProgramId("");
      setMemberReference("");
      setInitialBalance("0");
      await loadData();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível cadastrar a conta.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteAccount(account: Account) {
    const confirmed = window.confirm(
      `Excluir a conta de fidelidade ${account.loyaltyProgram.name}? Esta ação não pode ser desfeita.`,
    );
    if (!confirmed) return;
    setDeletingAccountId(account.id);
    setError("");
    setSuccess("");
    try {
      await readResponse(
        await fetch(`/api/loyalty-accounts/${encodeURIComponent(account.id)}`, {
          method: "DELETE",
        }),
      );
      setSuccess("Conta de fidelidade excluída.");
      await loadData();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Não foi possível excluir a conta.",
      );
    } finally {
      setDeletingAccountId("");
    }
  }

  async function createTransaction(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !transactionAccount ||
      !points ||
      Number(points) === 0 ||
      (transactionType !== "ADJUSTMENT" && Number(points) < 0)
    ) {
      setError(
        transactionType === "ADJUSTMENT"
          ? "Informe um ajuste diferente de zero."
          : "Informe uma quantidade positiva de pontos.",
      );
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await readResponse(
        await fetch(
          `/api/loyalty-accounts/${encodeURIComponent(transactionAccount)}/transactions`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: transactionType,
              points: Number(points),
              notes: notes.trim() || undefined,
            }),
          },
        ),
      );
      setSuccess("Movimentação registrada e saldo atualizado.");
      setPoints("");
      setNotes("");
      setTransactionAccount("");
      await loadData();
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Não foi possível registrar a movimentação.",
      );
    } finally {
      setSaving(false);
    }
  }

  const availablePrograms = programs.filter(
    (program) =>
      !accounts.some((account) => account.loyaltyProgram.id === program.id),
  );

  return (
    <section className="space-y-6">
      <PageHeader
        eyebrow="PATRIMÔNIO DE PONTOS"
        title="Programas e saldos"
        description="Organize suas contas de fidelidade e registre movimentações para manter os saldos consistentes."
      />

      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          role="status"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {success}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="panel loyalty-summary-card">
          <div className="flex items-center gap-3 text-slate-500">
            <WalletCards size={18} />
            <span className="text-sm">Contas cadastradas</span>
          </div>
          <div className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
            {accounts.length}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Programas vinculados ao seu perfil
          </p>
        </Card>
        <Card className="panel loyalty-summary-card">
          <div className="flex items-center gap-3 text-slate-500">
            <ArrowDownLeft size={18} />
            <span className="text-sm">Programas disponíveis</span>
          </div>
          <div className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
            {availablePrograms.length}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Ainda não vinculados à sua carteira
          </p>
        </Card>
        <Card className="panel loyalty-summary-card">
          <div className="flex items-center gap-3 text-slate-500">
            <ArrowUpRight size={18} />
            <span className="text-sm">Movimentações</span>
          </div>
          <div className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
            {accounts.reduce(
              (total, account) => total + (account._count?.transactions ?? 0),
              0,
            )}
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Lançamentos registrados nas contas
          </p>
        </Card>
      </div>

      <Card className="panel loyalty-create-card">
          <h2 className="text-lg font-semibold text-slate-900">
            Adicionar conta de fidelidade
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Informe o programa e, se souber, o saldo atual. O saldo inicial fica
            registrado como ajuste.
          </p>
          <form
            onSubmit={createAccount}
            className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          >
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Programa
              <select
                required
                value={programId}
                onChange={(event) => setProgramId(event.target.value)}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              >
                <option value="">Selecione...</option>
                {availablePrograms.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Identificação (opcional)
              <input
                value={memberReference}
                onChange={(event) => setMemberReference(event.target.value)}
                maxLength={120}
                placeholder="Número do associado"
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Saldo atual
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={initialBalance}
                onChange={(event) => setInitialBalance(event.target.value)}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              />
            </label>
            <div className="flex items-end gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? "Salvando..." : "Salvar conta"}
              </Button>
            </div>
          </form>
        </Card>

      {accounts.length > 0 && (
        <Card className="panel loyalty-summary-card">
          <h2 className="text-lg font-semibold text-slate-900">
            Registrar movimentação
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            As saídas reduzem o saldo; o sistema impede lançamentos que deixem o
            saldo negativo.
          </p>
          <form
            onSubmit={createTransaction}
            className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5"
          >
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Conta
              <select
                required
                value={transactionAccount}
                onChange={(event) => setTransactionAccount(event.target.value)}
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              >
                <option value="">Selecione...</option>
                {accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.loyaltyProgram.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Movimentação
              <select
                value={transactionType}
                onChange={(event) =>
                  setTransactionType(event.target.value as TransactionType)
                }
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              >
                {transactionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Quantidade de pontos
              <input
                type="number"
                min={transactionType === "ADJUSTMENT" ? undefined : "0.01"}
                step="0.01"
                required
                value={points}
                onChange={(event) => setPoints(event.target.value)}
                placeholder="Ex.: 2500"
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Observação (opcional)
              <input
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={500}
                placeholder="Detalhes da movimentação"
                className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              />
            </label>
            <div className="flex items-end">
              <Button type="submit" disabled={saving || !transactionAccount}>
                {saving ? "Salvando..." : "Registrar"}
              </Button>
            </div>
          </form>
          {transactionType === "ADJUSTMENT" && (
            <p className="mt-3 text-xs text-amber-800">
              Para ajuste de saldo, use valor positivo para aumentar ou negativo
              para reduzir.
            </p>
          )}
        </Card>
      )}

      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-slate-900">Sua carteira</h2>
          <span className="text-sm text-slate-500">
            {accounts.length} {accounts.length === 1 ? "programa" : "programas"}
          </span>
        </div>
        {loading ? (
          <div className="rounded-md border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Carregando seus programas e saldos...
          </div>
        ) : accounts.length === 0 ? (
          <Card className="border-dashed border-slate-300 bg-white p-10 text-center shadow-none">
            <WalletCards className="mx-auto text-amber-700" size={28} />
            <h3 className="mt-4 text-lg font-semibold text-slate-900">
              Sua carteira começa aqui
            </h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
              Cadastre a primeira conta para acompanhar saldos e registrar
              acúmulos, compras, transferências e resgates.
            </p>
            {programs.length === 0 && (
              <p className="mt-4 text-xs text-slate-500">
                O catálogo ainda não tem programas. Execute a carga inicial
                indicada nas instruções de configuração.
              </p>
            )}
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {accounts.map((account) => (
              <Card
                key={account.id}
                className="border-slate-200 bg-white p-5 shadow-none transition hover:border-amber-300"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-4">
                    <ProgramMark program={account.loyaltyProgram} />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-700">
                        {typeLabel[account.loyaltyProgram.type]}
                      </div>
                      <h3 className="mt-2 text-xl font-semibold text-slate-900">
                        {account.loyaltyProgram.name}
                      </h3>
                      {account.memberReference && (
                        <p className="mt-1 text-xs text-slate-500">
                          Identificação: {account.memberReference}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                      {account._count?.transactions ?? 0} mov.
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      aria-label={`Excluir conta ${account.loyaltyProgram.name}`}
                      title="Excluir conta"
                      disabled={saving || deletingAccountId !== ""}
                      onClick={() => void deleteAccount(account)}
                    >
                      {deletingAccountId === account.id ? (
                        <span className="text-xs">...</span>
                      ) : (
                        <Trash2 size={15} />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="mt-6 border-t border-slate-100 pt-4">
                  <div className="text-sm text-slate-500">Saldo disponível</div>
                  <div className="mt-1 text-3xl font-semibold tracking-tight text-slate-900">
                    {formatPoints(account.balance)}{" "}
                    <span className="text-sm font-normal text-slate-500">
                      {account.currency === "POINTS"
                        ? "pontos/milhas"
                        : account.currency}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Atualizado em{" "}
                    {new Date(account.updatedAt).toLocaleDateString("pt-BR")}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
