import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:4000";

type AuthResponse = {
  user?: {
    id: string;
    email: string;
    name: string | null;
    createdAt: string;
  };
  accessToken?: string;
};

export async function proxyAuth(
  request: Request,
  endpoint: "login" | "register",
) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { message: "Corpo da requisição inválido." },
      { status: 400 },
    );
  }

  let upstream: Response;

  try {
    upstream = await fetch(`${API_BASE_URL}/api/auth/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "Não foi possível conectar à API." },
      { status: 503 },
    );
  }

  const payload = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    return NextResponse.json(payload, {
      status: upstream.status,
    });
  }

  const auth = payload as AuthResponse;

  if (!auth.accessToken || !auth.user) {
    return NextResponse.json(
      { message: "Resposta de autenticação inválida." },
      { status: 502 },
    );
  }

  const response = NextResponse.json({ user: auth.user });

  response.cookies.set("fm_session", auth.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60,
  });

  return response;
}
