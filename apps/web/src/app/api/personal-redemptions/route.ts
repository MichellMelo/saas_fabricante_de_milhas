import { proxyPersonalTravel } from "@/lib/personal-travel-proxy";

export async function GET(request: Request) {
  const query = new URL(request.url).search;
  return proxyPersonalTravel("GET", `personal-redemptions${query}`);
}

export async function POST(request: Request) {
  return proxyPersonalTravel("POST", "personal-redemptions", request);
}
