import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const token = request.cookies.get("zsyspro_session")?.value;
  const backendUrl = process.env.BACKEND_API_URL;
  if (!token) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
  if (!backendUrl) {
    return NextResponse.json({ error: "Backend API URL is not configured." }, { status: 503 });
  }

  try {
    const response = await fetch(`${backendUrl.replace(/\/$/, "")}/api/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) {
      const result = NextResponse.json({ authenticated: false }, { status: response.status });
      if (response.status === 401) result.cookies.delete("zsyspro_session");
      return result;
    }
    return NextResponse.json(await response.json());
  } catch {
    return NextResponse.json({ error: "Unable to reach the account service." }, { status: 502 });
  }
}
