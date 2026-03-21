import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { OAUTH_SESSION_COOKIE_NAME } from "@/lib/oauth-session";
import { fetchGoogleUserInfo } from "@/lib/google-oauth-server";
import { refreshSessionIfNeeded } from "@/lib/oauth-session-refresh";
import {
  applyOAuthSessionCookie,
  clearOAuthSessionCookie,
} from "@/lib/oauth-session-cookie";

export async function GET() {
  try {
    const jar = await cookies();
    const raw = jar.get(OAUTH_SESSION_COOKIE_NAME)?.value;
    if (!raw) {
      return NextResponse.json({ authenticated: false });
    }

    const result = await refreshSessionIfNeeded(raw);
    if (!result) {
      const res = NextResponse.json({
        authenticated: false,
        expired: true,
      });
      clearOAuthSessionCookie(res);
      return res;
    }

    const info = await fetchGoogleUserInfo(result.payload.access_token);
    const res = NextResponse.json({
      authenticated: true,
      user: {
        id: info.id,
        email: info.email,
        name: info.name,
        picture: info.picture,
      },
    });

    if (result.cookieValue !== raw) {
      applyOAuthSessionCookie(res, result.cookieValue);
    }
    return res;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
