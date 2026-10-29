import { proxyLoyalty } from "@/lib/loyalty-proxy";
import { NextRequest } from "next/server";
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.toString();
  return proxyLoyalty("GET", `mile-finance/sales${query ? `?${query}` : ""}`);
}
export async function POST(request: Request) { return proxyLoyalty("POST", "mile-finance/sales", request); }
