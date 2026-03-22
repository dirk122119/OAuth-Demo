import { NextRequest, NextResponse } from "next/server";
import { exchangeGoogleCodeForTokens } from "@/lib/google-oauth-server";

/** RFC 7636 字元集內、但與真實 PKCE 不符的 verifier（僅供示範拒絕換票） */
const WRONG_VERIFIER =
  "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

/**
 * 示範：攻擊者持有竊聽到的 authorization_code，但無法提供與該次授權綁定的 code_verifier。
 * 對 Google token 端點換票應失敗（invalid_grant 等）。
 */
export async function POST(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return NextResponse.json(
      { error: "NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set" },
      { status: 500 }
    );
  }

  let body: { code?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code =
    typeof body.code === "string" && body.code.trim().length > 0
      ? body.code.trim()
      : "4/0AttackerDemo_fake_code";

  const origin = request.nextUrl.origin;

  try {
    await exchangeGoogleCodeForTokens(origin, code, WRONG_VERIFIER);
    return NextResponse.json(
      {
        outcome: "unexpected_success",
        message:
          "Unexpected: token endpoint accepted wrong verifier (should not happen in PKCE).",
      },
      { status: 200 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({
      outcome: "rejected",
      summary:
        "Authorization server 拒絕換票（預期）：攻擊者沒有與該 code 綁定的 code_verifier。",
      detail: msg,
    });
  }
}
