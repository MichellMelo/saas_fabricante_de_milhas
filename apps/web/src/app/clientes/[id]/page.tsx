import { ClientManagement } from "@/components/client-management";
import { SessionNotice } from "@/components/session-notice";
import { SessionRecovery } from "@/components/session-recovery";
import { readDashboardSession } from "@/lib/dashboard-session";

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await readDashboardSession();
  if (session.status === "expired") return <SessionRecovery />;
  if (session.status !== "authenticated") return <SessionNotice status={session.status} />;
  if (!session.user.isAdmin) return <SessionNotice status="forbidden" />;

  return (
    <main className="min-h-screen w-full max-w-full overflow-x-clip bg-[#f7f5ef] px-4 py-6 sm:px-8 sm:py-8">
      <div className="w-full min-w-0">
        <ClientManagement selectedClientId={id} />
      </div>
    </main>
  );
}
