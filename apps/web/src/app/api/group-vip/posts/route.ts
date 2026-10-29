import { proxyLoyalty } from "@/lib/loyalty-proxy";

export async function GET() {
  return proxyLoyalty("GET", "group-vip/posts");
}

export async function POST(request: Request) {
  return proxyLoyalty("POST", "group-vip/posts", request);
}
