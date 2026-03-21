"use client";

import {
  useState,
  useCallback,
  Suspense,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { LiveCrypto, type LiveCryptoHandle } from "@/components/LiveCrypto";
import { OAuthFlow, type OAuthFlowHandle } from "@/components/OAuthFlow";
import { StateSidebar, type OAuthState } from "@/components/StateSidebar";
import { UserProfile } from "@/components/UserProfile";
import { SequenceDiagram } from "@/components/SequenceDiagram";
import { OAuthFlowVisual } from "@/components/OAuthFlowVisual";
import { STORAGE_KEYS } from "@/lib/google-oauth";
import { deriveOAuthStep } from "@/lib/oauthFlowStep";

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

  const handleStateChange = useCallback((partial: Partial<OAuthState>) => {
    setState((s) => ({ ...s, ...partial }));
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEYS.OAUTH_RESULT);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<OAuthState>;
        setState((s) => ({ ...s, ...parsed }));
      } catch {
        sessionStorage.removeItem(STORAGE_KEYS.OAUTH_RESULT);
      }
    }
  }, []);

  useEffect(() => {
    if (!actionFeedback) return;
    const t = setTimeout(() => setActionFeedback(null), 4500);
    return () => clearTimeout(t);
  }, [actionFeedback]);

  const handleLogout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEYS.OAUTH_RESULT);
    sessionStorage.removeItem(STORAGE_KEYS.OAUTH_PENDING_GOOGLE);
    setState({});
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
          <header className="mb-12">
            <h1 className="text-3xl font-bold tracking-tight">
              OAuth 2.1 PKCE Playground
            </h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Touch it. Break it. Watch how PKCE defends against code interception.
            </p>
          </header>

          <LiveCrypto ref={liveRef} onStateChange={handleStateChange} />
          <OAuthFlow
            ref={oauthRef}
            codeVerifier={state.codeVerifier}
            codeChallenge={state.codeChallenge}
            accessToken={state.accessToken}
            onStateChange={handleStateChange}
            onLogout={handleLogout}
          />
          {state.accessToken && (
            <UserProfile accessToken={state.accessToken} />
          )}
          <OAuthFlowVisual
            authCode={state.authCode}
            codeVerifier={state.codeVerifier}
            clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
          />
          <SequenceDiagram
            syncedStep={syncedStep}
            onStepAction={handleStepAction}
            actionFeedback={actionFeedback}
          />
        </div>
      </main>
      <Suspense fallback={<aside className="w-72 shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 animate-pulse" />}>
        <StateSidebar state={state} />
      </Suspense>
    </div>
  );
}
