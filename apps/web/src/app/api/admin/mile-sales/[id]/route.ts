import { proxyLoyalty } from "@/lib/loyalty-proxy";

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyLoyalty("PUT", `admin/mile-sales/${encodeURIComponent(id)}`, request);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyLoyalty("DELETE", `admin/mile-sales/${encodeURIComponent(id)}`);
}
