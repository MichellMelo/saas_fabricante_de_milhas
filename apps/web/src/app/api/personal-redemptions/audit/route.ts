import { proxyPersonalTravel } from "@/lib/personal-travel-proxy";

export async function GET(request: Request) {
  const query = new URL(request.url).search;
  return proxyPersonalTravel("GET", `personal-redemptions/audit${query}`);
}
