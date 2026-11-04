import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  const token = request.cookies.get("zsyspro_session")?.value;
  const backendUrl = process.env.BACKEND_API_URL;
  if (!token) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!backendUrl) return NextResponse.json({ error: "Backend API URL is not configured." }, { status: 503 });

  try {
    const response = await fetch(`${backendUrl.replace(/\/$/, "")}/api/me`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json({ error: "Account deletion failed. Please try again." }, { status: response.status });
    }
    const result = NextResponse.json({ ok: true });
    result.cookies.delete("zsyspro_session");
    return result;
  } catch {
    return NextResponse.json({ error: "Unable to reach the account service." }, { status: 502 });
  }
}
