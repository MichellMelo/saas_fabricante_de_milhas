"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type AuthFormProps = {
  mode: "login" | "register";
};

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

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-900">
      <section className="w-full max-w-md rounded-2xl bg-white p-7 shadow-2xl sm:p-9">
        <Link href="/" className="mb-8 inline-flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-950 text-xl font-bold text-amber-300">
            FM
          </span>
          <span>
            <strong className="block text-lg tracking-tight">Fabricante</strong>
            <span className="text-xs font-semibold tracking-[0.2em] text-amber-700">
              DE MILHAS
            </span>
          </span>
        </Link>

        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
          Seu espaço de estratégia
        </p>
        <h1 className="text-3xl font-semibold tracking-tight">
          {isRegister ? "Crie sua conta." : "Bem-vindo de volta."}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {isRegister
            ? "Organize seus pontos, milhas e decisões de viagem."
            : "Entre para acessar seu painel de milhas."}
        </p>

        <form onSubmit={handleSubmit} className="mt-7 space-y-4">
          {isRegister && (
            <label className="block text-sm font-medium">
              Nome
              <input
                autoComplete="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={100}
                className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
                placeholder="Como podemos chamar você?"
              />
            </label>
          )}

          <label className="block text-sm font-medium">
            E-mail
            <input
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              placeholder="voce@exemplo.com"
            />
          </label>

          <label className="block text-sm font-medium">
            Senha
            <input
              type="password"
              autoComplete={isRegister ? "new-password" : "current-password"}
              required
              minLength={isRegister ? 12 : 1}
              maxLength={128}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-amber-600 focus:ring-2 focus:ring-amber-100"
              placeholder={isRegister ? "Mínimo de 12 caracteres" : "Sua senha"}
            />
            {isRegister && (
              <span className="mt-1 block text-xs text-slate-500">
                Use pelo menos 12 caracteres.
              </span>
            )}
          </label>

          {error && (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-slate-950 px-4 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Aguarde..."
              : isRegister
                ? "Criar minha conta"
                : "Entrar no painel"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          {isRegister ? "Já tem uma conta?" : "Ainda não tem uma conta?"}{" "}
          <Link
            href={isRegister ? "/login" : "/register"}
            className="font-semibold text-amber-800 hover:underline"
          >
            {isRegister ? "Fazer login" : "Criar conta"}
          </Link>
        </p>

        <p className="mt-8 text-center text-xs text-slate-400">
          Suas decisões de milhas começam com dados bem organizados.
        </p>
      </section>
    </main>
  );
}
