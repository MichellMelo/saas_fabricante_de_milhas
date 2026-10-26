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
    <main className="min-h-screen bg-[#f7f5ef] px-4 py-6 sm:px-8 sm:py-8">
      <div className="mx-auto w-full max-w-[1540px]">
        <div className="mb-5">
          <a href="/#clientes-admin" className="inline-flex min-h-10 items-center rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
            ← Voltar à lista
          </a>
        </div>
        <ClientManagement selectedClientId={id} />
      </div>
    </main>
  );
}
