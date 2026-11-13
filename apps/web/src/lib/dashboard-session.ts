import { cookies } from "next/headers";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:4000";

export type DashboardUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  isAdmin?: boolean;
  allowedPages?: string[];
  productAccesses?: { product: "GROUP_VIP" | "AULAO" | "MENTORSHIP"; active: boolean; startsAt: string; expiresAt: string | null }[];
};

type DashboardSession = { status: "authenticated"; user: DashboardUser }
  | { status: "expired" | "forbidden" | "unavailable" };

export async function readDashboardSession(): Promise<DashboardSession> {
  const token = (await cookies()).get("fm_session")?.value;
  if (!token) return { status: "expired" };

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (response.status === 401) return { status: "expired" };
    if (response.status === 403) return { status: "forbidden" };
    if (!response.ok) return { status: "unavailable" };

    const { user } = (await response.json()) as { user?: DashboardUser };
    return user?.id ? { status: "authenticated", user } : { status: "unavailable" };
  } catch {
    return { status: "unavailable" };
  }
}
