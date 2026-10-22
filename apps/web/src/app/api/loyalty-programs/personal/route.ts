import { proxyLoyalty } from "@/lib/loyalty-proxy";

export async function POST(request: Request) {
  return proxyLoyalty("POST", "loyalty-programs/personal", request);
}
