import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { OAUTH_SESSION_COOKIE_NAME } from "@/lib/oauth-session";
import { refreshSessionIfNeeded } from "@/lib/oauth-session-refresh";
import { applyOAuthSessionCookie } from "@/lib/oauth-session-cookie";
import { OAUTH_INTERNAL_ACCESS_HEADER } from "@/lib/oauth-internal-headers";

export async function middleware(request: NextRequest) {
  const token = request.cookies.get(OAUTH_SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  try {
    const result = await refreshSessionIfNeeded(token);
    if (!result) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(
      OAUTH_INTERNAL_ACCESS_HEADER,
      result.payload.access_token
    );

    const res = NextResponse.next({ request: { headers: requestHeaders } });
    if (result.cookieValue !== token) {
      applyOAuthSessionCookie(res, result.cookieValue);
    }
    return res;
  } catch {
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export const config = {
  matcher: ["/protected", "/protected/:path*"],
};
