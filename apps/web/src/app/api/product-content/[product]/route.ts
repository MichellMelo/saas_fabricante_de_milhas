import { proxyLoyalty } from "@/lib/loyalty-proxy";

type RouteContext = { params: Promise<{ product: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const { product } = await context.params;
  return proxyLoyalty("GET", `product-content/${encodeURIComponent(product)}`);
}

export async function POST(request: Request, context: RouteContext) {
  const { product } = await context.params;
  return proxyLoyalty("POST", `product-content/${encodeURIComponent(product)}`, request);
}
