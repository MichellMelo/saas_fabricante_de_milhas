import { proxyLoyalty } from "@/lib/loyalty-proxy";
export async function GET() { return proxyLoyalty("GET", "mile-finance/inventory"); }
