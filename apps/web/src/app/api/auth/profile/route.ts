import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_BASE_URL = process.env.API_BASE_URL ?? "http://127.0.0.1:4000";

export async function PATCH(request: Request) {
  const token = (await cookies()).get("fm_session")?.value;
  if (!token) return NextResponse.json({ message: "Sessão expirada. Entre novamente." }, { status: 401 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ message: "Corpo da requisição inválido." }, { status: 400 }); }
  try {
    const upstream = await fetch(`${API_BASE_URL}/api/auth/profile`, { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(body), cache: "no-store" });
    const payload = await upstream.json().catch(() => ({}));
    return NextResponse.json(payload, { status: upstream.status });
  } catch { return NextResponse.json({ message: "Não foi possível conectar à API." }, { status: 503 }); }
}
