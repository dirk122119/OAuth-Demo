import type { OAuthState } from "@/components/StateSidebar";
import { STORAGE_KEYS } from "@/lib/google-oauth";

/** 0–6：與 SequenceDiagram 步驟對齊 */
export function deriveOAuthStep(state: OAuthState): number {
  if (state.accessToken) return 6;

  if (typeof window !== "undefined") {
    if (sessionStorage.getItem(STORAGE_KEYS.OAUTH_PENDING_GOOGLE)) {
      if (state.codeVerifier && state.codeChallenge && !state.accessToken) {
        return 2;
      }
    }
  }

  if (state.codeChallenge && !state.accessToken) return 1;
  return 0;
}
