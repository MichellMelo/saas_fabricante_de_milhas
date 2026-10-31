import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:4000";

export async function POST() {
  const refreshToken = (await cookies()).get("fm_refresh")?.value;
  if (refreshToken) {
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
        cache: "no-store",
      });
    } catch {
      // A limpeza local da sessão continua mesmo se a API estiver indisponível.
    }
  }

  const response = NextResponse.json({ success: true });
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 0,
  };
  response.cookies.set("fm_session", "", { ...cookieOptions, path: "/" });
  response.cookies.set("fm_refresh", "", { ...cookieOptions, path: "/api/auth" });
  return response;
}
