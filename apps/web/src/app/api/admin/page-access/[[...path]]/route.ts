import { proxyLoyalty } from "@/lib/loyalty-proxy";

type Context = { params: Promise<{ path?: string[] }> };

export async function GET(request: Request, { params }: Context) {
  const { path = [] } = await params;
  const query = new URLSearchParams({ q: new URL(request.url).searchParams.get("q") ?? "" });
  if (path.length === 0) return proxyLoyalty("GET", `admin/page-access?${query}`);
  if (path.length !== 1) return new Response(null, { status: 404 });
  return proxyLoyalty("GET", `admin/page-access/${encodeURIComponent(path[0])}`);
}

export async function PUT(request: Request, { params }: Context) {
  const { path = [] } = await params;
  if (path.length !== 2) return new Response(null, { status: 404 });
  return proxyLoyalty("PUT", `admin/page-access/${path.map(encodeURIComponent).join("/")}`, request);
}
