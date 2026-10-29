import { proxyLoyalty } from "@/lib/loyalty-proxy";

type RouteContext = { params: Promise<{ product: string; id: string }> };

export async function POST(request: Request, context: RouteContext) {
  const { product, id } = await context.params;
  return proxyLoyalty("POST", `product-content/${encodeURIComponent(product)}/${encodeURIComponent(id)}/update`, request);
}
