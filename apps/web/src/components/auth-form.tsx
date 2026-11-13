"use client";

import { useState, type SubmitEvent } from "react";
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
        className="h-auto w-[104px] object-contain sm:w-[118px]"
        fetchPriority="high"
      />
    </Link>
  );
}

export function AuthForm({ mode }: AuthFormProps) {
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
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
      window.location.replace("/");
    } catch {
      setError(
        "Não foi possível conectar. Verifique sua conexão e tente novamente.",
      );
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-2 block w-full rounded-xl border border-[#dfe3e8] bg-[#fbfcfd] px-4 py-3 text-[14px] text-[#152033] outline-none transition placeholder:text-[#a1a9b5] hover:border-[#c4cbd4] focus:border-[#b58a37] focus:bg-white focus:ring-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#d6b66f] focus-visible:outline-offset-1 disabled:cursor-wait disabled:opacity-60";

  return (
    <main className="relative flex min-h-[100dvh] flex-col overflow-x-hidden bg-[#071426] text-[#111b2b]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_42%,#173356_0%,#0b1c33_45%,#071426_100%)]" />

        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle, #c8a45c 0.7px, transparent 1px)",
            backgroundSize: "22px 22px",
            maskImage:
              "linear-gradient(90deg, transparent 12%, black 65%, transparent 100%)",
          }}
        />

        <svg
          viewBox="0 0 1440 900"
          preserveAspectRatio="xMidYMid slice"
          className="absolute inset-0 h-full w-full"
        >
          <defs>
            <linearGradient id="goldTrail" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#a77b29" stopOpacity="0" />
              <stop offset="48%" stopColor="#e6c67b" stopOpacity=".85" />
              <stop offset="100%" stopColor="#c59845" stopOpacity=".15" />
            </linearGradient>
          </defs>

          <g fill="none" stroke="url(#goldTrail)">
            <path
              d="M-120 690 C230 860 490 480 830 595 S1280 750 1580 360"
              strokeWidth="3"
            />
            <path
              d="M-100 735 C260 910 520 515 850 635 S1300 790 1570 410"
              strokeWidth="1.5"
              opacity=".65"
            />
            <path
              d="M-140 785 C260 960 540 550 880 670 S1350 825 1600 450"
              strokeWidth="1"
              opacity=".4"
            />
          </g>

          <g fill="none" stroke="#d4b16b" strokeOpacity=".16">
            <ellipse cx="1040" cy="430" rx="370" ry="205" />
            <ellipse cx="1040" cy="430" rx="280" ry="205" />
            <ellipse cx="1040" cy="430" rx="145" ry="205" />
            <path d="M670 430 H1410" />
            <path d="M710 350 H1370" />
            <path d="M710 510 H1370" />
          </g>

          <g transform="translate(1230 200) rotate(-28)">
            <path
              d="M0 -38 L11 -8 L44 9 L44 17 L9 7 L7 35 L20 44 L20 49 L0 44 L-20 49 L-20 44 L-7 35 L-9 7 L-44 17 L-44 9 L-11 -8 Z"
              fill="#d8b670"
              opacity=".75"
            />
          </g>
        </svg>

        <div className="absolute bottom-0 h-1/3 w-full bg-gradient-to-t from-[#071426]/70 to-transparent" />
      </div>

      <header className="relative z-10 flex shrink-0 justify-center px-5 pb-1 pt-[clamp(14px,5vh,54px)]">
        <BrandLockup />
      </header>

      <div className="relative z-10 flex w-full flex-1 items-center justify-center px-4 py-6 sm:px-6 sm:py-10">
        <section className="mx-auto w-full max-w-[600px] shrink-0">
          <div className="relative overflow-hidden rounded-[25px] border border-white/80 bg-[#fffefd]/[0.96] p-5 shadow-[0_24px_70px_rgba(33,39,49,0.20)] backdrop-blur-md sm:rounded-[28px] sm:p-7 lg:p-8">
            <div
              aria-hidden="true"
              className="absolute right-0 top-0 h-1.5 w-full bg-gradient-to-r from-[#c99127] via-[#f1dfad] to-transparent"
            />
            <div className="mb-4 sm:mb-5">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.23em] text-[#a6792d] sm:text-[11px]">
                {isRegister
                  ? "Sua próxima decisão começa aqui"
                  : "Acesse sua estratégia"}
              </p>
              <h1 className="text-[27px] font-semibold leading-[1.12] tracking-[-0.05em] text-[#101a2b] sm:text-[32px]">
                {isRegister ? "Abra seu espaço." : "Continue de onde parou."}
              </h1>
              <p className="mt-2 max-w-[470px] text-[13px] leading-6 text-[#6f7886] sm:text-[14px] sm:leading-6">
                {isRegister
                  ? "Organize seus pontos e tenha mais critério para escolher quando comprar, transferir ou resgatar."
                  : "Entre para acompanhar seus pontos, custos e próximas oportunidades."}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-4">
              {isRegister && (
                <label className="block text-[12px] font-semibold text-[#344054]">
                  Como devemos chamar você?{" "}
                  <span className="font-normal text-[#9aa2ae]">Opcional</span>
                  <input
                    autoComplete="name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={100}
                    className={inputClass}
                    placeholder="Seu nome"
                    disabled={loading}
                  />
                </label>
              )}
              <label className="block text-[12px] font-semibold text-[#344054]">
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
              <label className="block text-[12px] font-semibold text-[#344054]">
                Senha
                <input
                  type="password"
                  autoComplete={
                    isRegister ? "new-password" : "current-password"
                  }
                  required
                  minLength={isRegister ? 12 : 1}
                  maxLength={128}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={inputClass}
                  placeholder={
                    isRegister ? "Crie uma senha segura" : "Digite sua senha"
                  }
                  disabled={loading}
                />
                {isRegister && (
                  <span className="mt-2 block text-[11px] font-normal leading-5 text-[#89919d]">
                    Mínimo de 12 caracteres.
                  </span>
                )}
              </label>

              {error && (
                <p
                  role="alert"
                  className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] leading-5 text-red-700"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                className="group flex w-full items-center justify-between rounded-xl bg-[#101a2b] px-5 py-[15px] text-[13px] font-semibold text-white shadow-[0_8px_20px_rgba(16,26,43,0.14)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#1b2a41] hover:shadow-[0_12px_26px_rgba(16,26,43,0.2)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#d6b66f]/30 disabled:translate-y-0 disabled:cursor-wait disabled:opacity-60"
              >
                <span className="inline-flex items-center gap-2.5">
                  {loading && (
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        className="opacity-90"
                        d="M21 12a9 9 0 0 0-9-9"
                        stroke="#d6b66f"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
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
                {!loading && (
                  <span
                    className="text-[#d6b66f] transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  >
                    ↗
                  </span>
                )}
              </button>
            </form>

            <p className="mt-4 text-center text-[12px] text-[#7b8491] sm:mt-5 sm:text-[13px]">
              {isRegister ? "Já tem uma conta?" : "Ainda não tem uma conta?"}{" "}
              <Link
                href={isRegister ? "/login" : "/register"}
                className="font-bold text-[#98691e] decoration-[#d6b66f] underline-offset-4 hover:underline"
              >
                {isRegister ? "Fazer login" : "Criar conta"}
              </Link>
            </p>

            <div className="mt-4 flex items-center justify-center gap-2 border-t border-[#eceef1] pt-3 text-[10px] text-[#89919d] sm:mt-5 sm:pt-4 sm:text-[11px]">
              <svg
                viewBox="0 0 16 16"
                className="h-3.5 w-3.5"
                fill="none"
                aria-hidden="true"
              >
                <rect
                  x="3"
                  y="7"
                  width="10"
                  height="7"
                  rx="1.5"
                  stroke="currentColor"
                  strokeWidth="1.3"
                />
                <path
                  d="M5 7V4.8a3 3 0 0 1 6 0V7"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                />
              </svg>
              Proteção de conta com sessão segura
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
