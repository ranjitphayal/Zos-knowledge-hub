import { NextRequest, NextResponse } from "next/server";

const providers = new Set(["google", "microsoft"]);

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ provider: string }> },
) {
  const { provider } = await context.params;
  const backendUrl = process.env.BACKEND_API_URL;
  if (!providers.has(provider) || !backendUrl) {
    return NextResponse.redirect(new URL("/?authError=provider_not_configured", request.url));
  }
  return NextResponse.redirect(
    `${backendUrl.replace(/\/$/, "")}/auth/${provider}/login`,
    { status: 307 },
  );
}
