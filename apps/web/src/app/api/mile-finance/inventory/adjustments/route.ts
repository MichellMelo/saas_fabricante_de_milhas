import { proxyLoyalty } from "@/lib/loyalty-proxy";
export async function POST(request: Request) { return proxyLoyalty("POST", "mile-finance/inventory/adjustments", request); }
