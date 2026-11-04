import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL("/?authError=missing_code", request.url));
  }

  const backendUrl = process.env.BACKEND_API_URL;
  if (!backendUrl) {
    return NextResponse.redirect(new URL("/?authError=backend_not_configured", request.url));
  }

  try {
    const response = await fetch(`${backendUrl.replace(/\/$/, "")}/auth/exchange`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.redirect(new URL("/?authError=exchange_failed", request.url));
    }

    const { access_token: accessToken, expires_in: expiresIn } = await response.json();
    if (typeof accessToken !== "string" || typeof expiresIn !== "number") {
      return NextResponse.redirect(new URL("/?authError=invalid_session", request.url));
    }

    const result = NextResponse.redirect(new URL("/", request.url));
    result.cookies.set("zsyspro_session", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.max(0, Math.floor(expiresIn)),
    });
    return result;
  } catch {
    return NextResponse.redirect(new URL("/?authError=backend_unavailable", request.url));
  }
}
