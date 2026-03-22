import type { OAuthState } from "@/components/StateSidebar";

/** 0–3：與 SequenceDiagram 四步對齊 */
export function deriveOAuthStep(state: OAuthState): number {
  if (state.hasServerSession) return 3;

  if (state.codeChallenge && !state.hasServerSession) return 1;

  return 0;
}
