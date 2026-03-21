/**
 * PKCE (RFC 7636) utilities for OAuth 2.1.
 * code_verifier: 43-128 chars, high entropy
 * code_challenge = base64url(SHA256(code_verifier))
 */

const CHARSET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
const VERIFIER_LENGTH = 64; // 43-128 per spec, 64 gives good entropy

/** Generate high-entropy code_verifier using Web Crypto */
export function generateCodeVerifier(): string {
  const bytes = new Uint8Array(VERIFIER_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CHARSET[b % CHARSET.length]).join("");
}

/** SHA-256 hash of verifier (returns raw bytes) */
export async function sha256(verifier: string): Promise<Uint8Array> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return new Uint8Array(hash);
}

/** Base64URL encode (no padding, URL-safe) */
export function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Compute code_challenge from code_verifier (S256 method) */
export async function computeCodeChallenge(verifier: string): Promise<string> {
  const hash = await sha256(verifier);
  return base64UrlEncode(hash);
}

/** Bytes to hex for display */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
