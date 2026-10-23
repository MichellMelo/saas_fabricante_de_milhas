import { proxyLoyalty } from "@/lib/loyalty-proxy";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyLoyalty("POST", `loyalty-accounts/${encodeURIComponent(id)}/transactions`, request);
}
