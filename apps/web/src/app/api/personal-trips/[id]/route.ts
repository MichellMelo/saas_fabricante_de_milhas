import { proxyPersonalTravel } from "@/lib/personal-travel-proxy";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyPersonalTravel("PATCH", `personal-trips/${encodeURIComponent(id)}`, request);
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  return proxyPersonalTravel("DELETE", `personal-trips/${encodeURIComponent(id)}`);
}
