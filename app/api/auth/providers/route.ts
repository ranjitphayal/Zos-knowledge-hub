import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const backendUrl = process.env.BACKEND_API_URL;
  if (!backendUrl) {
    return NextResponse.json({ google: false, microsoft: false, configured: false });
  }

  try {
    const response = await fetch(`${backendUrl.replace(/\/$/, "")}/auth/providers`, {
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json({ google: false, microsoft: false, configured: false }, { status: 503 });
    }
    return NextResponse.json({ ...(await response.json()), configured: true });
  } catch {
    return NextResponse.json({ google: false, microsoft: false, configured: false }, { status: 503 });
  }
}
