import { proxyLoyalty } from "@/lib/loyalty-proxy";

export async function GET() {
  return proxyLoyalty("GET", "admin/clients");
}

export async function POST(request: Request) {
  return proxyLoyalty("POST", "admin/clients", request);
}
