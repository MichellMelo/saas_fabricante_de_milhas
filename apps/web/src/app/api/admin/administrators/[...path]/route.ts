import { proxyLoyalty } from "@/lib/loyalty-proxy";

type RouteContext = { params: Promise<{ path: string[] }> };

async function endpoint(context: RouteContext) {
  const { path } = await context.params;
  return ["admin/administrators", ...path].join("/");
}

export async function GET(_request: Request, context: RouteContext) {
  return proxyLoyalty("GET", await endpoint(context));
}

export async function POST(request: Request, context: RouteContext) {
  return proxyLoyalty("POST", await endpoint(context), request);
}
