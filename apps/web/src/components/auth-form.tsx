"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type AuthFormProps = {
  mode: "login" | "register";
};

function BrandSymbol() {
  return (
    <span
      aria-hidden="true"
      className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-amber-300/25 bg-slate-950 shadow-lg shadow-slate-950/20"
    >
      <svg viewBox="0 0 48 48" className="h-9 w-9" fill="none">
        <path d="M8 30.5 21.8 16l-2.2 10.1 13.2-8.4-7.5 13.6-9.4-2.1L8 30.5Z" fill="#D6B66F" />
        <path d="M7 36.5c8.1-1.2 14.1-4.1 20.3-9.2 4.2-3.4 8.5-8.2 13.7-15.8" stroke="#F7E8BD" strokeWidth="1.8" strokeLinecap="round" />
        <path d="m33.2 12.9 7.8-1.4-2.1 7.4" stroke="#F7E8BD" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(isRegister ? { name: name.trim() } : {}),
          email: email.trim(),
          password,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        const message = result.message;
        setError(
          Array.isArray(message)
            ? message.join(" ")
            : typeof message === "string"
              ? message
              : "Não foi possível concluir a operação.",
        );
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("Não foi possível conectar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-amber-600 focus:ring-4 focus:ring-amber-500/10 disabled:cursor-not-allowed disabled:bg-slate-50";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0b1423] px-4 py-8 text-slate-900 sm:px-6 lg:py-12">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-36 h-96 w-96 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-48 -right-32 h-[32rem] w-[32rem] rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute inset-0 opacity-[0.07]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.16) 1px, transparent 1px)", backgroundSize: "48px 48px" }} />
      </div>

      <div className="relative grid w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-2xl shadow-black/30 lg:min-h-[620px] lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-[#111f33] p-10 text-white lg:flex xl:p-12">
          <div aria-hidden="true" className="absolute -right-24 top-28 h-72 w-72 rounded-full border border-amber-300/15" />
          <div aria-hidden="true" className="absolute -right-12 top-40 h-48 w-48 rounded-full border border-amber-300/15" />
          <div className="relative flex items-center gap-3">
            <BrandSymbol />
            <span className="leading-tight">
              <strong className="block text-lg font-semibold tracking-tight">Fabricante</strong>
              <span className="mt-1 block text-[10px] font-bold tracking-[0.32em] text-[#d6b66f]">DE MILHAS</span>
            </span>
          </div>

          <div className="relative max-w-sm py-12">
            <p className="mb-5 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.24em] text-[#d6b66f]">
              <span className="h-px w-7 bg-[#d6b66f]" />
              Estratégia em cada escolha
            </p>
            <h2 className="text-4xl font-semibold leading-[1.15] tracking-tight xl:text-[42px]">
              Viaje melhor.
              <br />
              <span className="font-light text-[#d6b66f]">Decida com dados.</span>
            </h2>
            <p className="mt-6 max-w-xs text-sm leading-7 text-slate-300">
              Organize seus pontos, acompanhe oportunidades e avalie cada resgate com mais clareza.
            </p>
            <div className="mt-9 flex items-center gap-3">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d6b66f]" />
              <span className="text-xs text-slate-400">Uma visão mais inteligente das suas milhas</span>
            </div>
          </div>

          <p className="relative text-[11px] text-slate-500">© 2026 Fabricante de Milhas</p>
        </aside>

        <section className="flex items-center justify-center px-6 py-9 sm:px-10 sm:py-12 lg:px-12 xl:px-16">
          <div className="w-full max-w-md">
            <Link href={isRegister ? "/register" : "/login"} className="mb-8 inline-flex items-center gap-3 lg:hidden">
              <BrandSymbol />
              <span className="leading-tight">
                <strong className="block text-base tracking-tight text-slate-900">Fabricante</strong>
                <span className="mt-1 block text-[9px] font-bold tracking-[0.28em] text-amber-700">DE MILHAS</span>
              </span>
            </Link>

            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-amber-700">
              {isRegister ? "Comece por aqui" : "Acesse seu espaço"}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-[34px]">
              {isRegister ? "Crie sua conta." : "Que bom ter você de volta."}
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              {isRegister
                ? "Tenha seus pontos e decisões de viagem organizados em um só lugar."
                : "Entre para continuar acompanhando suas estratégias de milhas."}
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {isRegister && (
                <label className="block text-sm font-medium text-slate-700">
                  Nome <span className="font-normal text-slate-400">(opcional)</span>
                  <input
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={100}
                    className={inputClass}
                    placeholder="Como podemos chamar você?"
                    disabled={loading}
                  />
                </label>
              )}

              <label className="block text-sm font-medium text-slate-700">
                E-mail
                <input
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={254}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={inputClass}
                  placeholder="voce@exemplo.com"
                  disabled={loading}
                />
              </label>

              <label className="block text-sm font-medium text-slate-700">
                Senha
                <input
                  type="password"
                  autoComplete={isRegister ? "new-password" : "current-password"}
                  required
                  minLength={isRegister ? 12 : 1}
                  maxLength={128}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={inputClass}
                  placeholder={isRegister ? "Pelo menos 12 caracteres" : "Digite sua senha"}
                  disabled={loading}
                />
                {isRegister && (
                  <span className="mt-2 block text-xs leading-5 text-slate-500">
                    Use pelo menos 12 caracteres para proteger sua conta.
                  </span>
                )}
              </label>

              {error && (
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#111f33] px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 transition hover:bg-[#1a2c46] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Aguarde..." : isRegister ? "Criar minha conta" : "Entrar no painel"}
                {!loading && <span aria-hidden="true">→</span>}
              </button>
            </form>

            <p className="mt-7 text-center text-sm text-slate-500">
              {isRegister ? "Já tem uma conta?" : "Ainda não tem uma conta?"}{" "}
              <Link
                href={isRegister ? "/login" : "/register"}
                className="font-semibold text-amber-800 underline-offset-4 hover:underline"
              >
                {isRegister ? "Fazer login" : "Criar conta"}
              </Link>
            </p>

            <div className="mt-8 flex items-center justify-center gap-2 border-t border-slate-100 pt-5 text-center text-[11px] text-slate-400">
              <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                <path d="M4.5 7V5a3.5 3.5 0 0 1 7 0v2M3 7h10v7H3V7Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Seus dados são transmitidos por conexão segura.
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
