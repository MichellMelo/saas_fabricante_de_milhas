import { proxyPersonalTravel } from "@/lib/personal-travel-proxy";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyPersonalTravel("POST", `personal-redemptions/${encodeURIComponent(id)}/permanent-delete`);
}
