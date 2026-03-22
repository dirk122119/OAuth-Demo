import { oauthCallbackUrl } from "@/lib/oauth-paths";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

const SCOPES = ["openid", "email", "profile"];

export function getGoogleClientId(): string {
  const id = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!id) throw new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is required");
  return id;
}

/**
 * Web 應用程式 OAuth 用戶端換票時 Google 會要求 client_secret（僅伺服器，勿用 NEXT_PUBLIC_）。
 * @see https://developers.google.com/identity/protocols/oauth2/web-server#exchange-authorization-code
 */
function getGoogleClientSecret(): string {
  const secret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  if (!secret) {
    throw new Error(
      "GOOGLE_CLIENT_SECRET is not set. In Google Cloud Console → Credentials → your OAuth 2.0 Web client, copy the Client secret. Add env GOOGLE_CLIENT_SECRET on your host (Vercel/Workers/etc.) and redeploy — .env.local is not shipped to production."
    );
  }
  return secret;
}

export function buildGoogleAuthUrlServer(
  origin: string,
  codeChallenge: string,
  state?: string
): string {
  const clientId = getGoogleClientId();
  const redirectUri = oauthCallbackUrl(origin);
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    access_type: "offline",
    prompt: "consent",
  });
  if (state) params.set("state", state);
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export async function exchangeGoogleCodeForTokens(
  origin: string,
  code: string,
  codeVerifier: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in: number;
}> {
  const clientId = getGoogleClientId();
  const redirectUri = oauthCallbackUrl(origin);
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: getGoogleClientSecret(),
    code,
    code_verifier: codeVerifier,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${err}`);
  }
  return res.json();
}

/** Google OAuth refresh（Web client 常需一併送 client_secret） */
export async function refreshGoogleAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
  token_type?: string;
}> {
  const clientId = getGoogleClientId();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: getGoogleClientSecret(),
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Refresh token failed: ${res.status} ${err}`);
  }
  return res.json();
}

export async function fetchGoogleUserInfo(accessToken: string): Promise<{
  id: string;
  email: string;
  verified_email: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  locale?: string;
}> {
  const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`UserInfo failed: ${res.status}`);
  return res.json();
}
