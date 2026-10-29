"use client";

import { Card } from "@/components/ui/card";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  ExternalLink,
  FileText,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Trash2,
} from "lucide-react";

type Post = {
  id: string;
  title: string;
  summary: string | null;
  body: string;
  externalUrl: string | null;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  author?: { name: string | null };
};

type FormState = {
  title: string;
  summary: string;
  body: string;
  externalUrl: string;
};
const EMPTY_FORM: FormState = {
  title: "",
  summary: "",
  body: "",
  externalUrl: "",
};

async function responseError(response: Response, fallback: string) {
  const result = await response.json().catch(() => ({}));
  if (response.ok) return result;
  const message = result.message;
  throw new Error(
    Array.isArray(message) ? message.join(" ") : message || fallback,
  );
}

export function GroupVipContent({ isAdmin }: { isAdmin: boolean }) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/group-vip/posts", {
        cache: "no-store",
      });
      const data = await responseError(
        response,
        "Não foi possível carregar o conteúdo do Grupo VIP.",
      );
      setPosts(data);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível carregar o conteúdo.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function startEdit(post: Post) {
    setEditingId(post.id);
    setForm({
      title: post.title,
      summary: post.summary ?? "",
      body: post.body,
      externalUrl: post.externalUrl ?? "",
    });
    setNotice("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function resetForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function savePost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    setNotice("");
    try {
      const endpoint = editingId
        ? `/api/group-vip/posts/${encodeURIComponent(editingId)}/update`
        : "/api/group-vip/posts";
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title.trim(),
          summary: form.summary.trim() || null,
          body: form.body.trim(),
          externalUrl: form.externalUrl.trim() || null,
        }),
      });
      await responseError(response, "Não foi possível salvar a publicação.");
      setNotice(
        editingId
          ? "Publicação atualizada."
          : "Rascunho criado. Publique quando estiver pronto.",
      );
      resetForm();
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível salvar a publicação.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(post: Post) {
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `/api/group-vip/posts/${encodeURIComponent(post.id)}/publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ published: !post.isPublished }),
        },
      );
      await responseError(
        response,
        "Não foi possível alterar o status da publicação.",
      );
      setNotice(
        post.isPublished
          ? "Publicação voltou para rascunho."
          : "Publicação disponível para os membros do Grupo VIP.",
      );
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível alterar a publicação.",
      );
    }
  }

  async function deletePost(post: Post) {
    if (!window.confirm(`Excluir definitivamente "${post.title}"?`)) return;
    setError("");
    setNotice("");
    try {
      const response = await fetch(
        `/api/group-vip/posts/${encodeURIComponent(post.id)}/delete`,
        { method: "POST" },
      );
      await responseError(response, "Não foi possível excluir a publicação.");
      if (editingId === post.id) resetForm();
      setNotice("Publicação excluída.");
      await load();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Não foi possível excluir a publicação.",
      );
    }
  }

  return (
    <section className="space-y-7">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a6792d]">
            {isAdmin ? "Administração · Conteúdo" : "Área exclusiva de membros"}
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            Grupo VIP
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            {isAdmin
              ? "Crie publicações, mantenha rascunhos e publique conteúdo interno ou links externos para os membros."
              : "Publicações, orientações e materiais exclusivos para os membros com acesso ativo."}
          </p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 disabled:opacity-50"
        >
          <RefreshCw size={15} /> Atualizar
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {error}
        </div>
      )}
      {notice && (
        <div
          role="status"
          className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {notice}
        </div>
      )}

      {isAdmin && (
        <form
          onSubmit={savePost}
          className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#f6f0e2] text-[#9a7129]">
              {editingId ? <Pencil size={18} /> : <Plus size={19} />}
            </span>
            <div>
              <h2 className="font-semibold text-slate-900">
                {editingId ? "Editar publicação" : "Nova publicação"}
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                O conteúdo é salvo como rascunho; você decide quando publicar.
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              Título
              <input
                required
                minLength={3}
                maxLength={180}
                value={form.title}
                onChange={(event) =>
                  setForm({ ...form, title: event.target.value })
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-[#b58a37]"
                placeholder="Ex.: Oportunidade de transferência"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Resumo{" "}
              <span className="font-normal text-slate-400">(opcional)</span>
              <input
                maxLength={300}
                value={form.summary}
                onChange={(event) =>
                  setForm({ ...form, summary: event.target.value })
                }
                className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-[#b58a37]"
                placeholder="Uma frase para contextualizar"
              />
            </label>
          </div>
          <label className="block text-sm font-medium text-slate-700">
            Conteúdo
            <textarea
              required
              maxLength={20000}
              rows={7}
              value={form.body}
              onChange={(event) =>
                setForm({ ...form, body: event.target.value })
              }
              className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-[#b58a37]"
              placeholder="Escreva a análise, orientação ou comunicado. Quebras de linha são preservadas."
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Link externo seguro{" "}
            <span className="font-normal text-slate-400">
              (opcional, HTTPS/HTTP)
            </span>
            <input
              type="url"
              maxLength={2048}
              value={form.externalUrl}
              onChange={(event) =>
                setForm({ ...form, externalUrl: event.target.value })
              }
              className="mt-2 w-full rounded-xl border border-slate-300 px-3.5 py-3 outline-none focus:border-[#b58a37]"
              placeholder="https://..."
            />
          </label>
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-[#101a2b] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
            >
              <FileText size={15} />{" "}
              {saving
                ? "Salvando..."
                : editingId
                  ? "Salvar alterações"
                  : "Salvar rascunho"}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600"
              >
                Cancelar edição
              </button>
            )}
          </div>
        </form>
      )}

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            {isAdmin ? "Publicações e rascunhos" : "Conteúdo do Grupo VIP"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {posts.length} {posts.length === 1 ? "publicação" : "publicações"}
          </p>
        </div>
        {loading ? (
          <p className="rounded-xl bg-white p-8 text-sm text-slate-500">
            Carregando conteúdo...
          </p>
        ) : posts.length === 0 ? (
          <Card className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <FileText size={26} className="mx-auto text-slate-400" />
            <p className="mt-3 font-medium text-slate-800">
              {isAdmin
                ? "Nenhuma publicação cadastrada."
                : "Ainda não há publicações disponíveis."}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              {isAdmin
                ? "Use o formulário acima para criar o primeiro conteúdo."
                : "Novos conteúdos aparecerão aqui quando forem publicados."}
            </p>
          </Card>
        ) : (
          posts.map((post) => (
            <article
              key={post.id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-semibold text-slate-900">
                      {post.title}
                    </h3>
                    {isAdmin && (
                      <span
                        className={
                          "rounded-full px-2.5 py-1 text-[11px] font-semibold " +
                          (post.isPublished
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700")
                        }
                      >
                        {post.isPublished ? "Publicado" : "Rascunho"}
                      </span>
                    )}
                  </div>
                  {post.summary && (
                    <p className="mt-2 text-sm text-slate-600">
                      {post.summary}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-slate-400">
                    {post.publishedAt
                      ? `Publicado em ${new Date(post.publishedAt).toLocaleDateString("pt-BR")}`
                      : `Criado em ${new Date(post.createdAt).toLocaleDateString("pt-BR")}`}
                  </p>
                </div>
              </div>
              <div className="mt-4 whitespace-pre-wrap break-words text-sm leading-7 text-slate-700">
                {post.body}
              </div>
              {post.externalUrl && (
                <a
                  href={post.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-[#8a6424] hover:bg-amber-50"
                >
                  <ExternalLink size={15} /> Abrir material externo
                </a>
              )}
              {isAdmin && (
                <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  <button
                    onClick={() => startEdit(post)}
                    className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700"
                  >
                    <Pencil size={13} /> Editar
                  </button>
                  <button
                    onClick={() => void togglePublished(post)}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#101a2b] px-3 py-2 text-xs font-semibold text-white"
                  >
                    <Send size={13} />{" "}
                    {post.isPublished ? "Retirar do ar" : "Publicar"}
                  </button>
                  <button
                    onClick={() => void deletePost(post)}
                    className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700"
                  >
                    <Trash2 size={13} /> Excluir
                  </button>
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}
