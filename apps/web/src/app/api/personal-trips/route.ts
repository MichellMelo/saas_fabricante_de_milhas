import { proxyPersonalTravel } from "@/lib/personal-travel-proxy";

export async function GET() {
  return proxyPersonalTravel("GET", "personal-trips");
}

export async function POST(request: Request) {
  return proxyPersonalTravel("POST", "personal-trips", request);
}
