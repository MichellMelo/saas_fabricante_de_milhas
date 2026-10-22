import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Dashboard } from "@/components/dashboard";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:4000";

type AuthenticatedUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  isAdmin?: boolean;
  productAccesses?: { product: "GROUP_VIP" | "AULAO" | "MENTORSHIP"; active: boolean; startsAt: string; expiresAt: string | null }[];
};

export default async function HomePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("fm_session")?.value;

  if (!token) {
    redirect("/login");
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "Não foi possível validar a sessão. Verifique se a API está disponível.",
    );
  }

  if (!response.ok) {
    redirect("/login");
  }

  const payload = (await response.json()) as {
    user: AuthenticatedUser;
  };

  return <Dashboard user={payload.user} />;
}
