import { proxyLoyalty } from "@/lib/loyalty-proxy";

type RouteContext = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyLoyalty("POST", `admin/payments/${encodeURIComponent(id)}/status`, request);
}
