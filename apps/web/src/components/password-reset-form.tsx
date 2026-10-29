"use client";

import { useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { KeyRound, ShieldCheck } from "lucide-react";

export function PasswordResetForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!token) {
      setError("O link está incompleto. Solicite uma nova redefinição ao administrador.");
      return;
    }
    if (password.length < 8) {
      setError("A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = result.message;
        setError(Array.isArray(message) ? message.join(" ") : typeof message === "string" ? message : "Não foi possível redefinir a senha.");
        return;
      }
      setSuccess(true);
    } catch {
      setError("Não foi possível conectar à aplicação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b1220] px-5 py-12 text-[#111b2b]">
      <section className="w-full max-w-lg rounded-3xl border border-white/60 bg-white p-8 shadow-2xl sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#a6792d]">Fabricante de Milhas · Segurança</p>
        <div className="mt-5 flex size-12 items-center justify-center rounded-2xl bg-amber-50 text-[#a6792d]">
          {success ? <ShieldCheck size={23} /> : <KeyRound size={23} />}
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{success ? "Senha redefinida" : "Defina uma nova senha"}</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {success
            ? "Sua senha foi atualizada e as sessões anteriores foram invalidadas. Entre novamente com a nova senha."
            : "Use pelo menos 8 caracteres. O link é válido por 30 minutos e só pode ser utilizado uma vez."}
        </p>
        {success ? (
          <button type="button" onClick={() => router.replace("/login")} className="mt-8 w-full rounded-xl bg-[#101a2b] px-4 py-3 font-semibold text-white transition hover:bg-[#1b2a40]">
            Ir para o login
          </button>
        ) : (
          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="block text-sm font-medium">Nova senha
              <input required minLength={8} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#b58a37] focus:ring-2 focus:ring-[#d6b66f]/20" />
            </label>
            <label className="block text-sm font-medium">Confirme a nova senha
              <input required minLength={8} type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-[#b58a37] focus:ring-2 focus:ring-[#d6b66f]/20" />
            </label>
            {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>}
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#101a2b] px-4 py-3 font-semibold text-white transition hover:bg-[#1b2a40] disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? "Salvando..." : "Redefinir senha"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
