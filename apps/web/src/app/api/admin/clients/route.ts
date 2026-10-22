import { proxyLoyalty } from "@/lib/loyalty-proxy";

export async function GET() {
  return proxyLoyalty("GET", "admin/clients");
}
