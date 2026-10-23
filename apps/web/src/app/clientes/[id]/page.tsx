import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { ClientManagement } from "@/components/client-management";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:4000";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get("fm_session")?.value;

  if (!token) redirect("/login");

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    throw new Error("Não foi possível validar a sessão. Verifique se a API está disponível.");
  }

  if (!response.ok) redirect("/login");
  const payload = (await response.json()) as { user?: { isAdmin?: boolean } };
  if (!payload.user?.isAdmin) notFound();

  return (
    <main className="min-h-screen bg-[#f7f5ef] px-4 py-8 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a6792d]">Fabricante de Milhas</p>
            <p className="mt-1 text-sm font-medium text-slate-700">Gestão individual de cliente</p>
          </div>
          <a href="/#clientes-admin" className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            ← Voltar à lista
          </a>
        </header>
        <ClientManagement selectedClientId={id} onBack={() => { window.location.assign("/#clientes-admin"); }} />
      </div>
    </main>
  );
}
