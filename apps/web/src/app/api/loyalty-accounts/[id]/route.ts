import { proxyLoyalty } from "@/lib/loyalty-proxy";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyLoyalty("DELETE", `loyalty-accounts/${encodeURIComponent(id)}`);
}
