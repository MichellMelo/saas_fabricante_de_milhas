import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:4000";

export async function POST() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("fm_refresh")?.value;
  if (!refreshToken) {
    return NextResponse.json({ message: "Sessão expirada. Entre novamente." }, { status: 401 });
  }

  try {
    const upstream = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
      cache: "no-store",
    });
    const payload = await upstream.json().catch(() => ({}));
    if (!upstream.ok || !payload.accessToken || !payload.refreshToken) {
      const response = NextResponse.json(
        { message: payload.message || "Não foi possível renovar a sessão." },
        { status: upstream.ok ? 502 : upstream.status },
      );
      if (upstream.status === 401) {
        response.cookies.set("fm_session", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 0 });
        response.cookies.set("fm_refresh", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/api/auth", maxAge: 0 });
      }
      return response;
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("fm_session", payload.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 15 * 60,
    });
    response.cookies.set("fm_refresh", payload.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/api/auth",
      maxAge: 30 * 24 * 60 * 60,
    });
    return response;
  } catch {
    return NextResponse.json({ message: "Não foi possível conectar à API." }, { status: 503 });
  }
}
