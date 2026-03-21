import type { NextResponse } from "next/server";
import { OAUTH_SESSION_COOKIE_NAME } from "@/lib/oauth-session";

const MAX_AGE_SEC = 60 * 60 * 24 * 30;

export function getOAuthSessionCookieOptions() {
  const secure = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    maxAge: MAX_AGE_SEC,
    secure,
  };
}

export function applyOAuthSessionCookie(res: NextResponse, value: string) {
  res.cookies.set(OAUTH_SESSION_COOKIE_NAME, value, getOAuthSessionCookieOptions());
}

export function clearOAuthSessionCookie(res: NextResponse) {
  const secure = process.env.NODE_ENV === "production";
  res.cookies.set(OAUTH_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure,
  });
}
