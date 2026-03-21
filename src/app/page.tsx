"use client";

import {
  useState,
  useCallback,
  Suspense,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
} from "react";
import { LiveCrypto, type LiveCryptoHandle } from "@/components/LiveCrypto";
import { OAuthFlow, type OAuthFlowHandle } from "@/components/OAuthFlow";
import { StateSidebar } from "@/components/StateSidebar";
import { UserProfile } from "@/components/UserProfile";
import { SequenceDiagram } from "@/components/SequenceDiagram";
import { FlowStepSpotlight } from "@/components/FlowStepSpotlight";
import { OAuthFlowVisual } from "@/components/OAuthFlowVisual";
import { STORAGE_KEYS } from "@/lib/google-oauth";
import { deriveOAuthStep } from "@/lib/oauthFlowStep";
import type { OAuthState } from "@/components/StateSidebar";

function readStoredOAuthState(): OAuthState {
  if (typeof window === "undefined") return {};
  const raw = sessionStorage.getItem(STORAGE_KEYS.OAUTH_RESULT);
  if (!raw) return {};
  try {
    return JSON.parse(raw) as OAuthState;
  } catch {
    sessionStorage.removeItem(STORAGE_KEYS.OAUTH_RESULT);
    return {};
  }
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

export default function Home() {
  const [state, setState] = useState<OAuthState>({});
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const liveRef = useRef<LiveCryptoHandle>(null);
  const oauthRef = useRef<OAuthFlowHandle>(null);

  const syncedStep = useMemo(() => deriveOAuthStep(state), [state]);

  /** 尚有上一輪 OAuth：token / code / pending / oauth_result → 先清掉才能操作 Live Crypto */
  const hasActivePlaygroundSession = useMemo(() => {
    if (typeof window === "undefined") return false;
    if (state.accessToken || state.authCode || state.refreshToken) return true;
    if (sessionStorage.getItem(STORAGE_KEYS.OAUTH_PENDING_GOOGLE)) return true;
    if (sessionStorage.getItem(STORAGE_KEYS.OAUTH_RESULT)) return true;
    return false;
  }, [state.accessToken, state.authCode, state.refreshToken]);

  const handleStateChange = useCallback((partial: Partial<OAuthState>) => {
    setState((s) => ({ ...s, ...partial }));
  }, []);

  useLayoutEffect(() => {
    const s = readStoredOAuthState();
    if (Object.keys(s).length > 0) setState(s);
  }, []);

  useEffect(() => {
    if (!actionFeedback) return;
    const t = setTimeout(() => setActionFeedback(null), 4500);
    return () => clearTimeout(t);
  }, [actionFeedback]);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEYS.OAUTH_RESULT);
    sessionStorage.removeItem(STORAGE_KEYS.OAUTH_PENDING_GOOGLE);
    sessionStorage.removeItem(STORAGE_KEYS.PKCE_VERIFIER);
    setState({});
  }, []);

  /** 每次按 Generate / Regenerate：清空上一輪 OAuth 與 PKCE，只留即將寫入的新 verifier */
  const clearBeforeNewPkce = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEYS.OAUTH_RESULT);
    sessionStorage.removeItem(STORAGE_KEYS.OAUTH_PENDING_GOOGLE);
    sessionStorage.removeItem(STORAGE_KEYS.PKCE_VERIFIER);
    setState({
      codeVerifier: undefined,
      codeChallenge: undefined,
      authCode: undefined,
      accessToken: undefined,
      refreshToken: undefined,
      idToken: undefined,
    });
  }, []);

  const handleStepAction = useCallback(
    (step: number) => {
      switch (step) {
        case 0:
          void liveRef.current?.generate();
          setActionFeedback(
            "已執行：產生 PKCE（等同 Live Cryptography 的 Generate）"
          );
          scrollToId("section-live-crypto");
          break;
        case 1:
          oauthRef.current?.startLogin();
          setActionFeedback(
            "已執行：前往 Google 授權（等同 Login with Google）"
          );
          scrollToId("section-oauth-flow");
          break;
        case 2:
          setActionFeedback(
            "請在 Google 分頁完成登入與同意；完成後會導回 /auth/callback 並換 token。"
          );
          break;
        case 3:
          scrollToId("section-oauth-flow-visual");
          setActionFeedback(
            "已捲動到「視覺化」；登入後 /auth/callback 會先顯示完整 ?code= 網址"
          );
          break;
        case 4:
        case 5:
          scrollToId("section-oauth-flow-visual");
          setActionFeedback(
            "步驟 4–5：callback 頁會先顯示 POST body 再換 token；下方區塊也有示意"
          );
          break;
        case 6:
          if (state.accessToken) {
            scrollToId("section-user-profile");
            setActionFeedback("已捲動到 Profile（UserInfo）");
          } else {
            setActionFeedback("尚無 access_token；請先完成 Google 登入。");
          }
          break;
        default:
          break;
      }
    },
    [state.accessToken]
  );

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">
              OAuth 2.1 PKCE Playground
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              先看序列圖與「目前執行順序」，再往下操作；步驟變更時會提示你現在在哪一步。
            </p>
          </header>

          <FlowStepSpotlight syncedStep={syncedStep} />

          <SequenceDiagram
            syncedStep={syncedStep}
            onStepAction={handleStepAction}
            actionFeedback={actionFeedback}
          />

          <div className="my-10 border-t border-zinc-200 dark:border-zinc-800 pt-10">
            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-6">
              依序操作（與圖中步驟對應）
            </p>

            {hasActivePlaygroundSession && (
              <div
                id="section-session-gate"
                className="mb-8 rounded-xl border border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/30 px-4 py-4 space-y-3"
              >
                <p className="text-sm font-medium text-amber-950 dark:text-amber-100">
                  偵測到尚未清空的 OAuth 狀態（已登入或進行中）
                </p>
                <p className="text-xs text-amber-900/90 dark:text-amber-200/90">
                  請先<strong>清除 session</strong>，才能從 Live Cryptography 重新開始；每輪流程會清空 token、code、PKCE 暫存。
                </p>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium transition-colors"
                >
                  清除並重新開始
                </button>
              </div>
            )}

            {!hasActivePlaygroundSession && (
              <LiveCrypto
                ref={liveRef}
                onStateChange={handleStateChange}
                onBeforeGenerate={clearBeforeNewPkce}
              />
            )}

            {!hasActivePlaygroundSession && state.codeChallenge && (
              <OAuthFlow
                ref={oauthRef}
                codeVerifier={state.codeVerifier}
                codeChallenge={state.codeChallenge}
                accessToken={state.accessToken}
                onStateChange={handleStateChange}
                onLogout={handleLogout}
              />
            )}

            <OAuthFlowVisual
              authCode={state.authCode}
              codeVerifier={state.codeVerifier}
              clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
              accessToken={state.accessToken}
            />

            {state.accessToken && (
              <UserProfile accessToken={state.accessToken} />
            )}
          </div>
        </div>
      </main>
      <Suspense fallback={<aside className="w-72 shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 animate-pulse" />}>
        <StateSidebar state={state} />
      </Suspense>
    </div>
  );
}
