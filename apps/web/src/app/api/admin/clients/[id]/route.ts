import { proxyLoyalty } from "@/lib/loyalty-proxy";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyLoyalty("POST", `admin/clients/${encodeURIComponent(id)}`, request);
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyLoyalty("DELETE", `admin/clients/${encodeURIComponent(id)}`);
}
