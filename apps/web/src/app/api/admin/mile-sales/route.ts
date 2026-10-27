import { proxyLoyalty } from "@/lib/loyalty-proxy";

export async function GET() {
  return proxyLoyalty("GET", "admin/mile-sales");
}

export async function POST(request: Request) {
  return proxyLoyalty("POST", "admin/mile-sales", request);
}
