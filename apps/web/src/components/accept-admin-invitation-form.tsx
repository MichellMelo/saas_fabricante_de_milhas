"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export function AcceptAdminInvitationForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!token) {
      setError("O link está incompleto. Solicite um novo convite ao administrador.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/accept-admin-invitation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, name: name.trim(), password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = result.message;
        setError(Array.isArray(message) ? message.join(" ") : typeof message === "string" ? message : "Não foi possível aceitar o convite.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Não foi possível conectar à aplicação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b1220] px-5 py-12 text-[#111b2b]">
      <section className="w-full max-w-lg rounded-3xl border border-white/60 bg-white p-8 shadow-2xl sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#a6792d]">Fabricante de Milhas · Administração</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">Ative seu acesso administrativo</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">Defina seu nome e senha para aceitar o convite. O acesso administrativo só será ativado após a conclusão deste formulário.</p>
        <form onSubmit={submit} className="mt-8 space-y-5">
          <label className="block text-sm font-medium">Seu nome
            <input required minLength={2} maxLength={100} value={name} onChange={(e) => setName(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#b58a37] focus:ring-2 focus:ring-[#d6b66f]/20" autoComplete="name" />
          </label>
          <label className="block text-sm font-medium">Crie uma senha
            <input required type="password" minLength={8} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#b58a37] focus:ring-2 focus:ring-[#d6b66f]/20" autoComplete="new-password" />
            <span className="mt-1 block text-xs font-normal text-slate-500">Mínimo de 8 caracteres.</span>
          </label>
          {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
          <button disabled={loading} className="w-full rounded-xl bg-[#101a2b] px-5 py-3.5 text-sm font-semibold text-white disabled:opacity-60">{loading ? "Ativando acesso..." : "Aceitar convite"}</button>
        </form>
      </section>
    </main>
  );
}
