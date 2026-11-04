import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const token = request.cookies.get("zsyspro_session")?.value;
  const backendUrl = process.env.BACKEND_API_URL;
  if (!token) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!backendUrl) return NextResponse.json({ error: "Backend API URL is not configured." }, { status: 503 });

  const { slug } = await context.params;
  const body = await request.json().catch(() => null);
  if (!body || !Number.isInteger(body.percent_complete) || body.percent_complete < 0 || body.percent_complete > 100) {
    return NextResponse.json({ error: "Progress must be a whole number between 0 and 100." }, { status: 422 });
  }

  try {
    const response = await fetch(`${backendUrl.replace(/\/$/, "")}/api/learning/${encodeURIComponent(slug)}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const result = await response.json();
    return NextResponse.json(result, { status: response.status });
  } catch {
    return NextResponse.json({ error: "Unable to reach the learning service." }, { status: 502 });
  }
}
