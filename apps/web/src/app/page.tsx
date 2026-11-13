import { Dashboard } from "@/components/dashboard";
import { SessionNotice } from "@/components/session-notice";
import { SessionRecovery } from "@/components/session-recovery";
import { readDashboardSession } from "@/lib/dashboard-session";

export default async function HomePage() {
  const session = await readDashboardSession();
  if (session.status === "authenticated") return <Dashboard user={session.user} />;
  if (session.status === "expired") return <SessionRecovery />;
  return <SessionNotice status={session.status} />;
}
