import { proxyLoyalty } from "@/lib/loyalty-proxy";

type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyLoyalty("PUT", `admin/payments/${encodeURIComponent(id)}`, request);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyLoyalty("DELETE", `admin/payments/${encodeURIComponent(id)}`);
}
