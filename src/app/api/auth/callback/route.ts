import { NextRequest, NextResponse } from "next/server";
import {
  exchangeGoogleCodeForTokens,
} from "@/lib/google-oauth-server";
import { signOAuthSession } from "@/lib/oauth-session";
import { applyOAuthSessionCookie } from "@/lib/oauth-session-cookie";
import { PKCE_VERIFIER_COOKIE } from "@/lib/oauth-cookies";

function clearPkceCookie(res: NextResponse) {
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(PKCE_VERIFIER_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure,
  });
}

export async function GET(request: NextRequest) {
  const origin = request.nextUrl.origin;
  const searchParams = request.nextUrl.searchParams;
  const err = searchParams.get("error");
  const code = searchParams.get("code");

  if (err) {
    const res = NextResponse.redirect(
      new URL(`/?oauth_error=${encodeURIComponent(err)}`, origin)
    );
    clearPkceCookie(res);
    return res;
  }

  if (!code) {
    const res = NextResponse.redirect(
      new URL("/?oauth_error=missing_code", origin)
    );
    clearPkceCookie(res);
    return res;
  }

  const verifier = request.cookies.get(PKCE_VERIFIER_COOKIE)?.value;
  if (!verifier) {
    return NextResponse.redirect(
      new URL("/?oauth_error=missing_pkce_cookie", origin)
    );
  }

  try {
    const tokens = await exchangeGoogleCodeForTokens(origin, code, verifier);
    const expiresAt = Date.now() + (tokens.expires_in ?? 3600) * 1000;
    const session = await signOAuthSession({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      id_token: tokens.id_token,
      expires_at: expiresAt,
    });
    const res = NextResponse.redirect(new URL("/?oauth=success", origin));
    clearPkceCookie(res);
    applyOAuthSessionCookie(res, session);
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const res = NextResponse.redirect(
      new URL(`/?oauth_error=${encodeURIComponent(msg)}`, origin)
    );
    clearPkceCookie(res);
    return res;
  }
}
