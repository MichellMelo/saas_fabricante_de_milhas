"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Building2, Check, CirclePlus, Pencil, ShieldCheck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ProgramType = "BANK" | "AIRLINE" | "HOTEL" | "OTHER";
type Program = { id: string; name: string; code: string; type: ProgramType; active: boolean; ownerUserId: string | null };
const typeOptions: Array<{ value: ProgramType; label: string }> = [
  { value: "BANK", label: "Banco / pontos" },
  { value: "AIRLINE", label: "Companhia aérea" },
  { value: "HOTEL", label: "Hotel" },
  { value: "OTHER", label: "Outro" },
];
const typeLabel: Record<ProgramType, string> = { BANK: "Banco / pontos", AIRLINE: "Companhia aérea", HOTEL: "Hotel", OTHER: "Outro" };

async function readResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(payload.message) ? payload.message.join(" ") : payload.message;
    throw new Error(message || "Não foi possível concluir a operação.");
  }
  return payload;
}

export function ProgramManagement({ onBack }: { onBack: () => void }) {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [canManageCatalog, setCanManageCatalog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [scope, setScope] = useState<"personal" | "catalog">("personal");
  const [name, setName] = useState("");
  const [type, setType] = useState<ProgramType>("AIRLINE");
  const [editing, setEditing] = useState<Program | null>(null);

  const loadPrograms = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await readResponse(await fetch("/api/loyalty-programs/manage", { cache: "no-store" }));
      setPrograms(payload.programs as Program[]);
      setCanManageCatalog(Boolean(payload.canManageCatalog));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível carregar os programas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadPrograms(); }, [loadPrograms]);

  function beginEdit(program: Program) {
    setEditing(program);
    setName(program.name);
    setType(program.type);
    setScope("catalog");
    setError("");
    setSuccess("");
  }

  function resetForm() {
    setEditing(null);
    setName("");
    setType("AIRLINE");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (name.trim().length < 2) {
      setError("Informe um nome com pelo menos 2 caracteres.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      let endpoint = "/api/loyalty-programs/personal";
      if (editing) endpoint = `/api/loyalty-programs/catalog/${encodeURIComponent(editing.id)}/update`;
      else if (scope === "catalog") endpoint = "/api/loyalty-programs/catalog";
      await readResponse(await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), type }),
      }));
      setSuccess(editing ? "Programa do catálogo atualizado." : scope === "catalog" ? "Programa adicionado ao catálogo geral." : "Programa personalizado criado para sua carteira.");
      resetForm();
      await loadPrograms();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível salvar o programa.");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(program: Program) {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await readResponse(await fetch(`/api/loyalty-programs/catalog/${encodeURIComponent(program.id)}/active`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !program.active }),
      }));
      setSuccess(program.active ? "Programa desativado no catálogo." : "Programa reativado no catálogo.");
      await loadPrograms();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Não foi possível alterar o programa.");
    } finally {
      setSaving(false);
    }
  }

  const catalogPrograms = programs.filter((program) => program.ownerUserId === null);
  const personalPrograms = programs.filter((program) => program.ownerUserId !== null);

  return (
    <section className="space-y-6">
      <div className="welcome-row">
        <div>
          <div className="eyebrow"><span className="eyebrow-line" /> CATÁLOGO E PERSONALIZAÇÃO</div>
          <h1 className="page-title">Cadastro de programas</h1>
          <p className="page-subtitle">Consulte o catálogo compartilhado e crie programas personalizados sem alterar a lista dos demais usuários.</p>
        </div>
      </div>

      {error && <div role="alert" className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>}
      {success && <div role="status" className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{success}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Card className="border-slate-200 bg-white p-5 shadow-none">
          <div className="flex items-center gap-3 text-slate-500"><Building2 size={18} /><span className="text-sm">Catálogo compartilhado</span></div>
          <div className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{catalogPrograms.length}</div>
          <p className="mt-1 text-xs text-slate-500">Programas gerais listados</p>
        </Card>
        <Card className="border-slate-200 bg-white p-5 shadow-none">
          <div className="flex items-center gap-3 text-slate-500"><UserRound size={18} /><span className="text-sm">Personalizados</span></div>
          <div className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">{personalPrograms.length}</div>
          <p className="mt-1 text-xs text-slate-500">Programas exclusivos do seu usuário</p>
        </Card>
        <Card className="border-slate-200 bg-white p-5 shadow-none">
          <div className="flex items-center gap-3 text-slate-500"><ShieldCheck size={18} /><span className="text-sm">Permissão de catálogo</span></div>
          <div className="mt-4 text-lg font-semibold tracking-tight text-slate-900">{canManageCatalog ? "Administrador" : "Somente leitura"}</div>
          <p className="mt-1 text-xs text-slate-500">{canManageCatalog ? "Pode editar e ativar programas gerais" : "Catálogo geral protegido contra alterações"}</p>
        </Card>
      </div>

      <Card className="border-slate-200 bg-white p-5 shadow-none">
        <h2 className="text-lg font-semibold text-slate-900">{editing ? "Editar programa do catálogo" : "Adicionar programa"}</h2>
        <p className="mt-1 text-sm text-slate-500">Programas personalizados ficam disponíveis apenas para você. Alterações no catálogo compartilhado exigem permissão administrativa.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button type="button" variant={scope === "personal" ? "default" : "outline"} onClick={() => { setScope("personal"); setEditing(null); setError(""); }}>Programa personalizado</Button>
          <Button type="button" variant={scope === "catalog" ? "default" : "outline"} disabled={!canManageCatalog && !editing} onClick={() => { setScope("catalog"); setError(""); }}>Catálogo geral</Button>
        </div>
        <form onSubmit={submit} className="mt-5 grid gap-4 md:grid-cols-[2fr_1fr_auto]">
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">Nome do programa
            <input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={80} placeholder="Ex.: programa regional de pontos" className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">Categoria
            <select value={type} onChange={(event) => setType(event.target.value as ProgramType)} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm font-normal outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100">
              {typeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <div className="flex items-end gap-2">
            <Button type="submit" disabled={saving || (scope === "catalog" && !canManageCatalog && !editing)}>{saving ? "Salvando..." : editing ? "Salvar alterações" : "Criar programa"}</Button>
            {(editing || name) && <Button type="button" variant="outline" onClick={() => { resetForm(); setError(""); }}>Limpar</Button>}
          </div>
        </form>
        {scope === "catalog" && !canManageCatalog && !editing && <p className="mt-3 text-xs text-amber-800">O catálogo geral é administrado centralmente. Você pode criar programas personalizados nesta página.</p>}
      </Card>

      <div className="grid gap-5 xl:grid-cols-2">
        <Card className="border-slate-200 bg-white p-5 shadow-none">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">Catálogo geral</h2><span className="text-sm text-slate-500">{catalogPrograms.length} programas</span></div>
          {loading ? <p className="py-6 text-sm text-slate-500">Carregando catálogo...</p> : catalogPrograms.length === 0 ? <p className="py-6 text-sm text-slate-500">Nenhum programa no catálogo.</p> : <div className="divide-y divide-slate-100">
            {catalogPrograms.map((program) => <div key={program.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1"><div className="font-medium text-slate-900">{program.name}</div><div className="mt-1 text-xs text-slate-500">{typeLabel[program.type]} · {program.code}</div></div>
              <span className={`rounded-full px-2.5 py-1 text-xs ${program.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{program.active ? "Ativo" : "Inativo"}</span>
              {canManageCatalog && <div className="flex gap-1"><Button type="button" variant="outline" size="icon" aria-label={`Editar ${program.name}`} onClick={() => beginEdit(program)}><Pencil size={14} /></Button><Button type="button" variant="outline" onClick={() => void toggleActive(program)} disabled={saving}>{program.active ? "Desativar" : "Ativar"}</Button></div>}
            </div>)}
          </div>}
        </Card>
        <Card className="border-slate-200 bg-white p-5 shadow-none">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold text-slate-900">Meus programas</h2><span className="text-sm text-slate-500">{personalPrograms.length} programas</span></div>
          {loading ? <p className="py-6 text-sm text-slate-500">Carregando seus programas...</p> : personalPrograms.length === 0 ? <div className="py-8 text-center"><CirclePlus className="mx-auto text-amber-700" size={26} /><p className="mt-3 text-sm text-slate-500">Você ainda não criou programas personalizados.</p></div> : <div className="divide-y divide-slate-100">
            {personalPrograms.map((program) => <div key={program.id} className="flex items-center gap-3 py-3"><div className="min-w-0 flex-1"><div className="font-medium text-slate-900">{program.name}</div><div className="mt-1 text-xs text-slate-500">{typeLabel[program.type]} · disponível apenas para você</div></div><span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs text-emerald-700"><Check size={12} className="mr-1 inline" />Ativo</span></div>)}
          </div>}
        </Card>
      </div>
    </section>
  );
}
