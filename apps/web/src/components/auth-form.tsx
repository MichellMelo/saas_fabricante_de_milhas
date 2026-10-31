"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type AuthFormProps = { mode: "login" | "register" };

function BrandLockup() {
  return (
    <Link
      href="/"
      className="inline-flex items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b66f]"
      aria-label="Fabricante de Milhas — página inicial"
    >
      <img
        src="/logo-sem-background.png"
        alt="Fabricante de Milhas"
        width={120}
        height={120}
        className="h-auto w-[66px] object-contain sm:w-[74px]"
        fetchPriority="high"
      />
    </Link>
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
        setError(Array.isArray(message) ? message.join(" ") : typeof message === "string" ? message : "Não foi possível concluir a operação.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch {
      setError("Não foi possível conectar. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass = "mt-2 block w-full rounded-xl border border-[#dfe3e8] bg-[#fbfcfd] px-4 py-3 text-[14px] text-[#152033] outline-none transition placeholder:text-[#a1a9b5] hover:border-[#c4cbd4] focus:border-[#b58a37] focus:bg-white focus:ring-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6b66f] focus-visible:outline-offset-1 disabled:cursor-wait disabled:opacity-60";

  return (
    <main className="relative flex h-[100svh] min-h-[600px] flex-col overflow-hidden bg-[#0d1728] text-[#111b2b]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <img
          src="/login-landscape.svg"
          alt=""
          className="h-full w-full object-cover object-center"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#fffdf9]/65 via-[#fffaf2]/30 to-[#e8d6c0]/25" />
        <div className="absolute inset-0 bg-white/10" />
      </div>

      <header className="relative z-10 flex shrink-0 justify-center px-5 pb-0 pt-3 sm:pt-4">
        <BrandLockup />
      </header>

      <div className="relative z-10 flex min-h-0 w-full flex-1 items-center justify-center overflow-y-auto px-4 py-2 sm:px-6 sm:py-3">
        <section className="mx-auto w-full max-w-[600px] shrink-0">
          <div className="relative overflow-hidden rounded-[25px] border border-white/70 bg-[#fffefd]/[0.98] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:rounded-[28px] sm:p-7 lg:p-8">
            <div aria-hidden="true" className="absolute right-0 top-0 h-1.5 w-full bg-gradient-to-r from-[#c99127] via-[#f1dfad] to-transparent" />
            <div className="mb-4 sm:mb-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.23em] text-[#a6792d] sm:text-[11px]">
                {isRegister ? "Sua próxima decisão começa aqui" : "Acesse sua estratégia"}
              </p>
              <h1 className="text-[27px] font-semibold leading-[1.12] tracking-[-0.05em] text-[#101a2b] sm:text-[32px]">
                {isRegister ? "Abra seu espaço." : "Continue de onde parou."}
              </h1>
              <p className="mt-2 max-w-[470px] text-[13px] leading-6 text-[#6f7886] sm:text-[14px] sm:leading-6">
                {isRegister ? "Organize seus pontos e tenha mais critério para escolher quando comprar, transferir ou resgatar." : "Entre para acompanhar seus pontos, custos e próximas oportunidades."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
              {isRegister && (
                <label className="block text-[12px] font-semibold text-[#344054]">
                  Como devemos chamar você? <span className="font-normal text-[#9aa2ae]">Opcional</span>
                  <input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} maxLength={100} className={inputClass} placeholder="Seu nome" disabled={loading} />
                </label>
              )}
              <label className="block text-[12px] font-semibold text-[#344054]">
                E-mail
                <input type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className={inputClass} placeholder="voce@exemplo.com" disabled={loading} />
              </label>
              <label className="block text-[12px] font-semibold text-[#344054]">
                Senha
                <input type="password" autoComplete={isRegister ? "new-password" : "current-password"} required minLength={isRegister ? 12 : 1} maxLength={128} value={password} onChange={(event) => setPassword(event.target.value)} className={inputClass} placeholder={isRegister ? "Crie uma senha segura" : "Digite sua senha"} disabled={loading} />
                {isRegister && <span className="mt-2 block text-[11px] font-normal leading-5 text-[#89919d]">Mínimo de 12 caracteres.</span>}
              </label>

              {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] leading-5 text-red-700">{error}</p>}

              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="group flex w-full items-center justify-between rounded-xl bg-[#101a2b] px-5 py-[15px] text-[13px] font-semibold text-white shadow-[0_8px_20px_rgba(16,26,43,0.14)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#1b2a41] hover:shadow-[0_12px_26px_rgba(16,26,43,0.2)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b66f]/30 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-60"
              >
                <span className="inline-flex items-center gap-2.5">
                  {loading && (
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-90" d="M21 12a9 9 0 0 0-9-9" stroke="#d6b66f" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                  )}
                  <span>
                    {loading
                      ? isRegister
                        ? "Criando sua conta..."
                        : "Entrando..."
                      : isRegister
                        ? "Criar minha conta"
                        : "Entrar no meu espaço"}
                  </span>
                </span>
                {!loading && <span className="text-[#d6b66f] transition-transform group-hover:translate-x-1" aria-hidden="true">↗</span>}
              </button>
            </form>

            <p className="mt-4 text-center text-[12px] text-[#7b8491] sm:mt-5 sm:text-[13px]">
              {isRegister ? "Já tem uma conta?" : "Ainda não tem uma conta?"}{" "}
              <Link href={isRegister ? "/login" : "/register"} className="font-bold text-[#98691e] decoration-[#d6b66f] underline-offset-4 hover:underline">
                {isRegister ? "Fazer login" : "Criar conta"}
              </Link>
            </p>

            <div className="mt-4 flex items-center justify-center gap-2 border-t border-[#eceef1] pt-3 text-[10px] text-[#89919d] sm:mt-5 sm:pt-4 sm:text-[11px]">
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
                <path d="M5 7V4.8a3 3 0 0 1 6 0V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
              </svg>
              Proteção de conta com sessão segura
            </div>
          </div>
        </section>
      </div>

      <footer className="relative z-10 mt-auto shrink-0 px-4 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 text-center text-[9px] leading-4 text-white/55 sm:text-[10px]">
        
        © 2026 Fabricante de Milhas · Estratégias, oportunidades e viagens
      </footer>
    </main>
  );
}
