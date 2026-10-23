import { proxyLoyalty } from "@/lib/loyalty-proxy";

export async function GET() {
  return proxyLoyalty("GET", "admin/invitations");
}

export async function POST(request: Request) {
  return proxyLoyalty("POST", "admin/invitations", request);
}
