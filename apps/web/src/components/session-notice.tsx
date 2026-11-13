import Link from "next/link";

export function SessionNotice({ status }: { status: "forbidden" | "unavailable" }) {
  return (
    <main className="mx-auto max-w-lg p-8">
      {status === "forbidden" ? (
        <>
          <h1 className="text-xl font-semibold">Acesso negado</h1>
          <p className="mt-2">Sua conta não tem acesso a esta página.</p>
          <Link className="mt-3 inline-block underline" href="/">Voltar ao início</Link>
        </>
      ) : (
        <>
          <h1 className="text-xl font-semibold">Sessão indisponível</h1>
          <p className="mt-2" role="alert">Não foi possível validar a sessão agora. Atualize a página para tentar novamente.</p>
        </>
      )}
    </main>
  );
}
