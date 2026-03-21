import { NextResponse } from "next/server";
import { OAUTH_SESSION_COOKIE_NAME } from "@/lib/oauth-session";

export async function POST() {
  const secure = process.env.NODE_ENV === "production";
  const res = NextResponse.json({ ok: true });
  res.cookies.set(OAUTH_SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure,
  });
  return res;
}
