export type OAuthSessionPayload = {
  access_token: string;
  refresh_token?: string;
  id_token?: string;
  /** epoch ms */
  expires_at: number;
};

const COOKIE_NAME = "oauth_session";

function getSecret(): string {
  const s = process.env.OAUTH_SESSION_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "OAUTH_SESSION_SECRET is required (min 16 chars). Set in .env.local"
    );
  }
  return s;
}

function bytesToBase64Url(bytes: Uint8Array): string {
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(s: string): Uint8Array {
  const pad = 4 - (s.length % 4 || 4);
  const b64 = (s + "=".repeat(pad)).replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)!;
  return out;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  const raw = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(secret)
  );
  return crypto.subtle.importKey(
    "raw",
    raw,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/** 簽署 session（Route Handler / Server Component 用） */
export async function signOAuthSession(
  payload: OAuthSessionPayload
): Promise<string> {
  const key = await importHmacKey(getSecret());
  const body = new TextEncoder().encode(JSON.stringify(payload));
  const sig = await crypto.subtle.sign("HMAC", key, body);
  return `${bytesToBase64Url(body)}.${bytesToBase64Url(new Uint8Array(sig))}`;
}

/** 驗證並解析（Server / Middleware / Edge 共用） */
export async function verifyOAuthSession(
  token: string
): Promise<OAuthSessionPayload | null> {
  try {
    const key = await importHmacKey(getSecret());
    const i = token.lastIndexOf(".");
    if (i <= 0) return null;
    const bodyB64 = token.slice(0, i);
    const sigB64 = token.slice(i + 1);
    const body = base64UrlToBytes(bodyB64);
    const sig = base64UrlToBytes(sigB64);
    const ok = await crypto.subtle.verify(
      "HMAC",
      key,
      sig as BufferSource,
      body as BufferSource
    );
    if (!ok) return null;
    const parsed = JSON.parse(
      new TextDecoder().decode(body)
    ) as OAuthSessionPayload;
    if (
      typeof parsed.access_token !== "string" ||
      typeof parsed.expires_at !== "number"
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export { COOKIE_NAME as OAUTH_SESSION_COOKIE_NAME };
