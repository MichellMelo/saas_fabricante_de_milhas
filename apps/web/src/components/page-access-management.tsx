"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

type AccessUser = { id: string; name: string | null; email: string; active: boolean; isAdmin: boolean };
type PageGroup = { label: string; pages: { key: string; label: string; product?: string }[] };
type UserAccess = { isAdmin: boolean; allowedPages: string[]; activeProducts: string[] };

async function accessRequest<Result>(path: string, options?: RequestInit): Promise<Result> {
  const response = await fetch(`/api/admin/page-access${path}`, { cache: "no-store", ...options });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Não foi possível consultar ou salvar os acessos.");
  return data;
}

export function PageAccessManagement() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<AccessUser[]>([]);
  const [groups, setGroups] = useState<PageGroup[]>([]);
  const [selected, setSelected] = useState<AccessUser | null>(null);
  const [searching, setSearching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const result = await accessRequest<{ users: AccessUser[]; groups: PageGroup[] }>(
          `?${new URLSearchParams({ q: query })}`, { signal: controller.signal },
        );
        setUsers(result.users);
        setGroups(result.groups);
      } catch (cause) {
        if (!controller.signal.aborted) setError((cause as Error).message);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 250);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  return (
    <div className="grid items-start gap-5 lg:grid-cols-[minmax(16rem,1fr)_minmax(0,2fr)]">
      <Card className="space-y-3 p-5">
        <label htmlFor="access-user-search" className="block font-medium">Buscar usuário</label>
        <input
          id="access-user-search"
          type="search"
          className="w-full rounded-md border px-3 py-2 text-sm"
          placeholder="Nome ou e-mail"
          maxLength={254}
          value={query}
          onChange={(event) => {
            setSearching(true);
            setError("");
            setQuery(event.target.value);
          }}
        />
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        {searching ? <p role="status" className="text-sm text-slate-600">Buscando usuários…</p> : (
          <ul className="max-h-96 space-y-1 overflow-y-auto">
            {users.map((user) => (
              <li key={user.id}>
                <button
                  type="button"
                  aria-pressed={selected?.id === user.id}
                  className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-50 aria-pressed:bg-slate-100"
                  onClick={() => setSelected(user)}
                >
                  <span className="block font-medium">{user.name || user.email}</span>
                  {user.name && <span className="block break-all text-slate-600">{user.email}</span>}
                  {user.isAdmin && <span className="block text-slate-600">Administrador</span>}
                  {!user.active && <span className="block text-slate-600">Conta inativa</span>}
                </button>
              </li>
            ))}
          </ul>
        )}
        {!searching && !error && users.length === 0 && <p className="text-sm text-slate-600">Nenhum usuário encontrado.</p>}
      </Card>
      {selected ? <UserPermissions key={selected.id} user={selected} groups={groups} /> : (
        <Card className="p-5 text-sm text-slate-600">Selecione um usuário para consultar suas permissões.</Card>
      )}
    </div>
  );
}

function UserPermissions({ user, groups }: { user: AccessUser; groups: PageGroup[] }) {
  const [access, setAccess] = useState<UserAccess | null>(null);
  const [pending, setPending] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const path = `/${encodeURIComponent(user.id)}`;

  useEffect(() => {
    const controller = new AbortController();
    accessRequest<UserAccess>(path, { signal: controller.signal })
      .then(setAccess)
      .catch((cause: Error) => {
        if (!controller.signal.aborted) setError(cause.message);
      });
    return () => controller.abort();
  }, [path]);

  async function save(page: string, allowed: boolean) {
    setPending(true);
    setError("");
    setStatus("");
    try {
      const saved = await accessRequest<{ page: string; allowed: boolean }>(`${path}/${encodeURIComponent(page)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allowed }),
      });
      setAccess((current) => current && {
        ...current,
        allowedPages: saved.allowed
          ? [...current.allowedPages, saved.page]
          : current.allowedPages.filter((key) => key !== saved.page),
      });
      setStatus("Permissão salva.");
    } catch (cause) {
      setError((cause as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="space-y-4 p-5">
      <h2 className="break-all text-lg font-semibold">{user.name || user.email}</h2>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {!access && !error && <p role="status">Carregando permissões…</p>}
      {access && (
        <>
          <p className="text-sm text-slate-600">
            {access.isAdmin
              ? "Administradores têm acesso integral. Estas permissões são protegidas."
              : "As páginas administrativas são reservadas a administradores. Produtos exigem também um acesso ativo em Clientes e produtos."}
          </p>
          {groups.map((group) => (
            <fieldset key={group.label} disabled={pending || access.isAdmin} className="divide-y rounded-lg border px-4">
              <legend className="px-2 text-sm font-semibold">{group.label}</legend>
              {group.pages.map(({ key, label, product }) => (
                <div key={key} className="flex items-center justify-between gap-4 py-3">
                  <div>
                    <label htmlFor={`permission-${key}`} className="text-sm font-medium">{label}</label>
                    {product && !access.isAdmin && !access.activeProducts.includes(product) && (
                      <p className="text-xs text-slate-600">Sem acesso ativo ao produto</p>
                    )}
                  </div>
                  <Switch
                    id={`permission-${key}`}
                    disabled={pending || access.isAdmin}
                    checked={access.isAdmin || access.allowedPages.includes(key)}
                    onCheckedChange={(allowed) => void save(key, allowed)}
                  />
                </div>
              ))}
            </fieldset>
          ))}
          <p role="status" className="min-h-5 text-sm text-slate-600">{pending ? "Salvando…" : status}</p>
        </>
      )}
    </Card>
  );
}
