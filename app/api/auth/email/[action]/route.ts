import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const backendPaths: Record<string, string> = {
  register: "/auth/email/register",
  login: "/auth/email/login",
  "resend-verification": "/auth/email/resend-verification",
  forgot: "/auth/password/forgot",
  reset: "/auth/password/reset",
  verify: "/auth/email/verify",
};

type RouteContext = { params: Promise<{ action: string }> };

function backendEndpoint(path: string) {
  const backendUrl = process.env.BACKEND_API_URL;
  return backendUrl ? `${backendUrl.replace(/\/$/, "")}${path}` : null;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { action } = await context.params;
  const path = backendPaths[action];
  const endpoint = path && backendEndpoint(path);
  if (!endpoint) {
    return NextResponse.json({ error: "Account service is not configured." }, { status: 503 });
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(await request.json()),
      cache: "no-store",
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json(
        { error: typeof data.detail === "string" ? data.detail : "The request could not be completed." },
        { status: response.status },
      );
    }

    if (action !== "login") return NextResponse.json(data, { status: response.status });

    const exchangeEndpoint = backendEndpoint("/auth/exchange");
    if (!exchangeEndpoint || typeof data.code !== "string") {
      return NextResponse.json({ error: "Sign-in could not be completed." }, { status: 502 });
    }
    const exchange = await fetch(exchangeEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: data.code }),
      cache: "no-store",
    });
    const session = await exchange.json().catch(() => ({}));
    if (!exchange.ok || typeof session.access_token !== "string" || typeof session.expires_in !== "number") {
      return NextResponse.json({ error: "Sign-in could not be completed." }, { status: 502 });
    }

    const result = NextResponse.json({ authenticated: true });
    result.cookies.set("zsyspro_session", session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: Math.max(0, Math.floor(session.expires_in)),
    });
    return result;
  } catch {
    return NextResponse.json({ error: "Unable to reach the account service." }, { status: 502 });
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { action } = await context.params;
  if (action !== "verify") {
    return NextResponse.json({ error: "Not found." }, { status: 404 });
  }
  const endpoint = backendEndpoint(backendPaths.verify);
  const token = request.nextUrl.searchParams.get("token");
  if (!endpoint || !token) {
    return NextResponse.redirect(new URL("/?authError=verification_failed", request.url));
  }

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.redirect(new URL("/?authError=verification_failed", request.url));
    }
    return NextResponse.redirect(new URL("/?authMessage=email_verified", request.url));
  } catch {
    return NextResponse.redirect(new URL("/?authError=backend_unavailable", request.url));
  }
}
