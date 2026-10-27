"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type AuthFormProps = { mode: "login" | "register" };

function BrandLockup() {
  return (
    <Link href="/" className="mx-auto inline-flex items-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d6b66f] lg:hidden" aria-label="Fabricante de Milhas — página inicial">
      <img
        src="/logo-sem-background.png"
        alt="Fabricante de Milhas"
        width={120}
        height={120}
        className="h-auto w-[72px] object-contain sm:w-[88px] lg:w-[104px]"
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

  const inputClass = "mt-2 block w-full rounded-xl border border-[#dfe3e8] bg-[#fbfcfd] px-4 py-[11px] text-[14px] sm:mt-2.5 sm:py-[12px] text-[#152033] outline-none transition placeholder:text-[#a1a9b5] hover:border-[#c4cbd4] focus:border-[#b58a37] focus:bg-white focus:ring-4 focus:ring-[#d6b66f]/15 disabled:cursor-wait disabled:opacity-60";

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#0b1220] text-[#111b2b] lg:h-dvh lg:min-h-0 lg:overflow-hidden">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -left-40 -top-48 h-[560px] w-[560px] rounded-full bg-[#b68b3c]/10 blur-[100px]" />
        <div className="absolute -bottom-64 right-[18%] h-[520px] w-[520px] rounded-full bg-[#315174]/20 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.045]" style={{ backgroundImage: "linear-gradient(rgba(255,255,255,.22) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.22) 1px, transparent 1px)", backgroundSize: "56px 56px" }} />
      </div>

      <header className="relative z-10 mx-auto flex w-full max-w-[1280px] items-center justify-center px-5 py-3 sm:px-8 sm:py-4 lg:justify-end lg:px-10 lg:py-2">
        <BrandLockup />
        <div className="hidden items-center gap-2 text-[10px] tracking-[0.12em] text-slate-400 lg:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#d6b66f]" />
          SEU ESPAÇO DE ESTRATÉGIA
        </div>
      </header>

      <div className="relative z-10 mx-auto grid w-full min-h-[calc(100vh-104px)] max-w-[1280px] items-center gap-6 px-5 pb-6 pt-2 sm:gap-10 sm:px-8 sm:pb-10 sm:pt-4 lg:min-h-0 lg:h-[calc(100dvh-48px)] lg:grid-cols-[minmax(0,1fr)_minmax(380px,440px)] lg:gap-12 lg:px-10 lg:pb-4 lg:pt-0 xl:gap-16">
        <section className="relative hidden min-h-0 flex-col justify-center lg:flex">
          <div aria-hidden="true" className="absolute left-[-90px] top-1/2 h-[430px] w-[430px] -translate-y-1/2 rounded-full border border-[#d6b66f]/10" />
          <div aria-hidden="true" className="absolute left-[-28px] top-1/2 h-[320px] w-[320px] -translate-y-1/2 rounded-full border border-[#d6b66f]/10" />
          <div aria-hidden="true" className="absolute left-[40px] top-1/2 h-[210px] w-[210px] -translate-y-1/2 rounded-full border border-[#d6b66f]/10" />
          <div className="relative max-w-[650px]">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.035] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e0c47f]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d6b66f]" />
              Inteligência para suas milhas
            </div>
            <h1 className="max-w-[620px] text-[48px] font-medium leading-[1.06] tracking-[-0.055em] text-white xl:text-[60px]">
              Milhas não são sorte.
              <span className="mt-2 block text-[#d6b66f]">São estratégia.</span>
            </h1>
            <p className="mt-4 max-w-[430px] text-[14px] leading-6 sm:mt-6 sm:leading-7 text-slate-300/80">
              Compare custos, entenda o valor real dos seus pontos e transforme cada decisão em uma viagem melhor planejada.
            </p>
            <div className="mt-6 flex max-w-[440px] items-center gap-5 border-t border-white/10 pt-5">
              <div className="flex -space-x-2">
                <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-[#0b1220] bg-[#26364a] text-[10px] font-bold text-white">CP</span>
                <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-[#0b1220] bg-[#39465a] text-[10px] font-bold text-white">R$</span>
                <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-[#0b1220] bg-[#d6b66f] text-[10px] font-bold text-[#101827]">✦</span>
              </div>
              <div>
                <p className="text-[12px] font-medium text-white">Mais clareza para decidir</p>
                <p className="mt-1 text-[11px] text-slate-400">Custo por milheiro · valor de resgate · taxas</p>
              </div>
            </div>
          </div>
          <p className="absolute bottom-0 left-0 text-[11px] text-slate-500">© 2026 Fabricante de Milhas</p>
        </section>

        <section className="mx-auto w-full max-w-[440px] lg:my-auto">
          <div className="relative overflow-hidden rounded-[22px] border border-white/80 bg-[#fffefd] p-5 shadow-[0_20px_55px_rgba(0,0,0,0.2)] sm:rounded-[24px] sm:p-8 lg:p-7 xl:p-8">
            <div aria-hidden="true" className="absolute right-0 top-0 h-1 w-full bg-gradient-to-r from-[#d6b66f] via-[#f1dfad] to-transparent" />
            <div className="mb-5 flex items-start justify-between gap-4 sm:mb-6">
              <div>
                <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.23em] text-[#a6792d]">
                  {isRegister ? "Sua próxima decisão começa aqui" : "Acesse sua estratégia"}
                </p>
                <h2 className="text-[27px] font-semibold leading-[1.12] tracking-[-0.05em] sm:text-[29px] text-[#101a2b]">
                  {isRegister ? "Abra seu espaço." : "Continue de onde parou."}
                </h2>
                <p className="mt-3 max-w-[340px] text-[13px] leading-6 text-[#6f7886]">
                  {isRegister ? "Organize seus pontos e tenha mais critério para escolher quando comprar, transferir ou resgatar." : "Entre para acompanhar seus pontos, custos e próximas oportunidades."}
                </p>
              </div>
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

              <button type="submit" disabled={loading} className="group flex w-full items-center justify-between rounded-xl bg-[#101a2b] px-5 py-[15px] text-[13px] font-semibold text-white shadow-[0_8px_20px_rgba(16,26,43,0.14)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#1b2a41] hover:shadow-[0_12px_26px_rgba(16,26,43,0.2)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b66f]/30 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-60">
                <span>{loading ? "Preparando seu acesso..." : isRegister ? "Criar minha conta" : "Entrar no meu espaço"}</span>
                <span className="text-[#d6b66f] transition-transform group-hover:translate-x-1" aria-hidden="true">↗</span>
              </button>
            </form>

            <p className="mt-5 text-center text-[12px] text-[#7b8491] sm:mt-7">
              {isRegister ? "Já tem uma conta?" : "Ainda não tem uma conta?"}{" "}
              <Link href={isRegister ? "/login" : "/register"} className="font-bold text-[#98691e] decoration-[#d6b66f] underline-offset-4 hover:underline">
                {isRegister ? "Fazer login" : "Criar conta"}
              </Link>
            </p>

            <div className="mt-5 flex items-center justify-center gap-2 border-t sm:mt-7 border-[#eceef1] pt-5 text-[10px] text-[#9aa2ae]">
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden="true"><rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M5 7V4.8a3 3 0 0 1 6 0V7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
              Proteção de conta com sessão segura
            </div>
          </div>
          <p className="mt-5 text-center text-[10px] leading-5 text-slate-500 lg:hidden">© 2026 Fabricante de Milhas · Estratégias, oportunidades e viagens</p>
        </section>
      </div>
    </main>
  );
}
