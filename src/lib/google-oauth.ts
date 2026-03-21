/**
 * Google OAuth 2.0 + PKCE
 * https://developers.google.com/identity/protocols/oauth2/web-server
 */

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

const SCOPES = ["openid", "email", "profile"];

export interface GoogleOAuthConfig {
  clientId: string;
  redirectUri: string;
}

function getConfig(): GoogleOAuthConfig {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) throw new Error("NEXT_PUBLIC_GOOGLE_CLIENT_ID is required");
  const redirectUri =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : process.env.NEXT_PUBLIC_OAUTH_REDIRECT_URI ?? "http://localhost:3000/auth/callback";
  return { clientId, redirectUri };
}

/** 不 throw，給教學 UI / callback 預覽用 */
export function peekOAuthConfig(): GoogleOAuthConfig | null {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) return null;
  const redirectUri =
    typeof window !== "undefined"
      ? `${window.location.origin}/auth/callback`
      : "";
  return { clientId, redirectUri };
}

/** Build authorization URL for redirect to Google */
export function buildAuthUrl(
  codeChallenge: string,
  state?: string
): string {
  const { clientId, redirectUri } = getConfig();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: SCOPES.join(" "),
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    access_type: "offline", // optional: get refresh_token
    prompt: "consent", // always show consent to get refresh_token
  });
  if (state) params.set("state", state);
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

/** Exchange authorization code for tokens */
export async function exchangeCodeForTokens(
  code: string,
  codeVerifier: string
): Promise<{
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  expires_in: number;
}> {
  const { clientId, redirectUri } = getConfig();
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      code,
      code_verifier: codeVerifier,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Token exchange failed: ${res.status} ${err}`);
  }
  return res.json();
}

/** Fetch user profile using access token */
export async function fetchUserInfo(accessToken: string): Promise<{
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

/** SessionStorage keys for OAuth flow (verifier persists across redirect) */
export const STORAGE_KEYS = {
  PKCE_VERIFIER: "oauth_pkce_verifier",
  OAUTH_RESULT: "oauth_result",
  /** Set before redirect to Google; cleared on success / logout */
  OAUTH_PENDING_GOOGLE: "oauth_pending_google",
} as const;
