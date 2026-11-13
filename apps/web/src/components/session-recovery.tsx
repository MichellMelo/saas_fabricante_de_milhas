"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

let renewal: Promise<Response> | undefined;

export function SessionRecovery() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    renewal ??= fetch("/api/auth/refresh", { method: "POST", cache: "no-store" })
      .finally(() => { renewal = undefined; });
    renewal.then((response) => {
      if (cancelled) return;
      if (response.ok) {
        setFailed(true);
        router.refresh();
      }
      else if (response.status === 401) window.location.replace("/login");
      else setFailed(true);
    }).catch(() => {
      if (!cancelled) setFailed(true);
    });
    return () => { cancelled = true; };
  }, [router]);

  return (
    <main className="mx-auto max-w-lg p-8">
      {failed ? (
        <>
          <p role="alert">Não foi possível renovar sua sessão agora.</p>
          <button type="button" className="mt-3 underline" onClick={() => window.location.reload()}>
            Tentar novamente
          </button>
        </>
      ) : <p role="status">Validando sua sessão…</p>}
    </main>
  );
}
