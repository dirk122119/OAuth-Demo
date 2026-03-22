import {
  verifyOAuthSession,
  signOAuthSession,
  type OAuthSessionPayload,
} from "@/lib/oauth-session";
import { refreshGoogleAccessToken } from "@/lib/google-oauth-server";

/** 過期前提前換發，減少邊界 401 */
const REFRESH_SKEW_MS = 120_000;

export function shouldRefreshAccess(payload: OAuthSessionPayload): boolean {
  return payload.expires_at <= Date.now() + REFRESH_SKEW_MS;
}

/**
 * 驗簽後若 access 將過期／已過期且有 refresh_token，向 Google 換新 access。
 * 成功時回傳新 cookie 字串（簽署後整串），需 Set-Cookie。
 */
export async function refreshSessionIfNeeded(
  rawCookie: string | undefined
): Promise<{ payload: OAuthSessionPayload; cookieValue: string } | null> {
  if (!rawCookie) return null;
  const payload = await verifyOAuthSession(rawCookie);
  if (!payload) return null;

  if (!shouldRefreshAccess(payload)) {
    return { payload, cookieValue: rawCookie };
  }

  if (!payload.refresh_token) {
    return null;
  }

  try {
    const tokens = await refreshGoogleAccessToken(payload.refresh_token);
    const newPayload: OAuthSessionPayload = {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token ?? payload.refresh_token,
      id_token: payload.id_token,
      expires_at: Date.now() + (tokens.expires_in ?? 3600) * 1000,
    };
    const cookieValue = await signOAuthSession(newPayload);
    return { payload: newPayload, cookieValue };
  } catch {
    return null;
  }
}
