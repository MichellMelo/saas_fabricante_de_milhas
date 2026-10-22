import { proxyLoyalty } from "@/lib/loyalty-proxy";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  return proxyLoyalty("POST", `group-vip/posts/${encodeURIComponent(id)}/delete`);
}
