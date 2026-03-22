import { NextRequest, NextResponse } from "next/server";
import { buildGoogleAuthUrlServer } from "@/lib/google-oauth-server";
import { PKCE_VERIFIER_COOKIE } from "@/lib/oauth-cookies";
const PKCE_MAX_AGE = 600;

/** RFC 7636: code_verifier 43–128 chars from [A-Z a-z 0-9 - . _ ~] */
const VERIFIER_RE = /^[A-Za-z0-9._~-]{43,128}$/;

export async function POST(request: NextRequest) {
  try {
    if (!process.env.OAUTH_SESSION_SECRET) {
      return NextResponse.json(
        { error: "OAUTH_SESSION_SECRET is not set" },
        { status: 500 }
      );
    }
    let body: { codeVerifier?: string; codeChallenge?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const { codeVerifier, codeChallenge } = body;
    if (
      typeof codeVerifier !== "string" ||
      typeof codeChallenge !== "string" ||
      !VERIFIER_RE.test(codeVerifier)
    ) {
      return NextResponse.json({ error: "Invalid PKCE parameters" }, { status: 400 });
    }

    const origin = request.nextUrl.origin;
    const url = buildGoogleAuthUrlServer(origin, codeChallenge);
    const res = NextResponse.json({ url });
    const secure = process.env.NODE_ENV === "production";
    res.cookies.set(PKCE_VERIFIER_COOKIE, codeVerifier, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: PKCE_MAX_AGE,
      secure,
    });
    return res;
  } catch (e) {
    console.error("[api/auth/google/start]", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
