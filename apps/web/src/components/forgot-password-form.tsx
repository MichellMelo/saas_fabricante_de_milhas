"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/auth/request-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message = result.message;
        setError(Array.isArray(message) ? message.join(" ") : typeof message === "string" ? message : "Não foi possível processar sua solicitação.");
        return;
      }
      setSubmitted(true);
    } catch {
      setError("Não foi possível conectar à aplicação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0b1220] px-5 py-12 text-[#111b2b]">
      <section className="w-full max-w-md rounded-3xl border border-white/60 bg-[#fffefd] p-7 shadow-2xl sm:p-9">
        <p className="text-[10px] font-bold uppercase tracking-[0.23em] text-[#a6792d]">Fabricante de Milhas · Segurança</p>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight">{submitted ? "Verifique seu e-mail" : "Recuperar senha"}</h1>
        <p className="mt-3 text-sm leading-6 text-[#6f7886]">
          {submitted
            ? "Se o endereço informado estiver cadastrado, enviaremos um link para redefinir sua senha. Verifique também a pasta de spam."
            : "Informe o e-mail associado à sua conta. Enviaremos um link seguro para criar uma nova senha."}
        </p>
        {submitted ? (
          <Link href="/login" className="mt-8 block w-full rounded-xl bg-[#101a2b] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#1b2a40]">Voltar ao login</Link>
        ) : (
          <form onSubmit={submit} className="mt-7 space-y-5">
            <label className="block text-sm font-medium text-[#344054]">E-mail
              <input required type="email" autoComplete="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-xl border border-[#dfe3e8] bg-[#fbfcfd] px-4 py-3 text-sm text-[#152033] outline-none focus:border-[#b58a37] focus:ring-2 focus:ring-[#d6b66f]/20" placeholder="voce@exemplo.com" disabled={loading} />
            </label>
            {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#101a2b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1b2a40] disabled:cursor-wait disabled:opacity-60">{loading ? "Enviando..." : "Enviar link de recuperação"}</button>
          </form>
        )}
        {!submitted && <p className="mt-6 text-center text-sm text-[#7b8491]"><Link href="/login" className="font-semibold text-[#98691e] hover:underline">Voltar ao login</Link></p>}
      </section>
    </main>
  );
}
