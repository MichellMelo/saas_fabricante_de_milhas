import { proxyLoyalty } from "@/lib/loyalty-proxy";

type Period = "30" | "90" | "365" | "all";

export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get("period");
  const period: Period = ["30", "90", "365", "all"].includes(requested ?? "")
    ? (requested as Period)
    : "30";
  return proxyLoyalty("GET", `loyalty-accounts/balance-evolution?period=${period}`);
}
