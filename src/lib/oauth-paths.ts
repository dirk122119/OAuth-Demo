/** OAuth redirect 必須與 Google Cloud Console Authorized redirect URIs 完全一致 */
export const OAUTH_CALLBACK_PATH = "/api/auth/callback" as const;

export function oauthCallbackUrl(origin: string): string {
  return `${origin.replace(/\/$/, "")}${OAUTH_CALLBACK_PATH}`;
}
