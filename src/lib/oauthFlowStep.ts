import type { OAuthState } from "@/components/StateSidebar";

export type DeriveOAuthStepOpts = {
  /** 回站時 URL 短暫帶 ?oauth=success（換票中，對齊步驟 ②） */
  oauthSuccessInUrl?: boolean;
};

/** 0–3：與 SequenceDiagram / SEQUENCE_STEPS 四步對齊 */
export function deriveOAuthStep(
  state: OAuthState,
  opts?: DeriveOAuthStepOpts
): number {
  if (state.hasServerSession) return 3;
  if (opts?.oauthSuccessInUrl) return 2;
  if (state.codeChallenge && !state.hasServerSession) return 1;
  return 0;
}
