import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:4000";

export async function proxyLoyalty(
  method: "GET" | "POST" | "PUT" | "DELETE",
  endpoint: string,
  request?: Request,
) {
  const token = (await cookies()).get("fm_session")?.value;
  if (!token) {
    return NextResponse.json(
      { message: "Sessão expirada. Entre novamente." },
      { status: 401 },
    );
  }

  let body: string | undefined;
  if ((method === "POST" || method === "PUT") && request) {
    try {
      const rawBody = await request.text();
      // Endpoints such as cancel/resend invitations do not require a body.
      // Empty request bodies should be forwarded as body-less requests, not rejected as invalid JSON.
      if (rawBody.trim()) {
        body = JSON.stringify(JSON.parse(rawBody));
      }
    } catch {
      return NextResponse.json(
        { message: "Corpo da requisição inválido." },
        { status: 400 },
      );
    }
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE_URL}/api/${endpoint}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body } : {}),
      cache: "no-store",
    });
  } catch {
    return NextResponse.json(
      { message: "Não foi possível conectar à API." },
      { status: 503 },
    );
  }

  const payload = await upstream.json().catch(() => ({}));
  return NextResponse.json(payload, { status: upstream.status });
}
