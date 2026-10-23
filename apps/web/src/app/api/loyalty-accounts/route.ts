import { proxyLoyalty } from "@/lib/loyalty-proxy";

export async function GET() {
  return proxyLoyalty("GET", "loyalty-accounts");
}

export async function POST(request: Request) {
  return proxyLoyalty("POST", "loyalty-accounts", request);
}
