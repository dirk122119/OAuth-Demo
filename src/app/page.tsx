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
import { useSearchParams, useRouter } from "next/navigation";
import { LiveCrypto, type LiveCryptoHandle } from "@/components/LiveCrypto";
import { OAuthFlow, type OAuthFlowHandle } from "@/components/OAuthFlow";
import { StateSidebar } from "@/components/StateSidebar";
import { UserProfile } from "@/components/UserProfile";
import { SequenceDiagram } from "@/components/SequenceDiagram";
import { FlowStepSpotlight } from "@/components/FlowStepSpotlight";
import { OAuthFlowVisual } from "@/components/OAuthFlowVisual";
import { AttackerPovPanel } from "@/components/AttackerPovPanel";
import { STORAGE_KEYS } from "@/lib/google-oauth";
import { deriveOAuthStep } from "@/lib/oauthFlowStep";
import type { OAuthState } from "@/components/StateSidebar";
import Link from "next/link";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  picture?: string;
};

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [state, setState] = useState<OAuthState>({});
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  /** 本輪 callback 的真實 code（供視覺化；來自 redirect 或 sessionStorage） */
  const [displayAuthCode, setDisplayAuthCode] = useState<string | null>(null);
  const liveRef = useRef<LiveCryptoHandle>(null);
  const oauthRef = useRef<OAuthFlowHandle>(null);

  const syncedStep = useMemo(() => deriveOAuthStep(state), [state]);

  const loadSession = useCallback(async () => {
    try {
      const r = await fetch("/api/auth/session", { credentials: "include" });
      const d = (await r.json()) as {
        authenticated?: boolean;
        user?: SessionUser;
      };
      if (d.authenticated && d.user) {
        setSessionUser(d.user);
        setState((s) => ({ ...s, hasServerSession: true }));
      } else {
        setSessionUser(null);
        setState((s) => ({ ...s, hasServerSession: false }));
      }
    } catch {
      setSessionUser(null);
      setState((s) => ({ ...s, hasServerSession: false }));
    }
  }, []);

  const hasActivePlaygroundSession = useMemo(() => {
    if (typeof window === "undefined") return false;
    if (state.hasServerSession) return true;
    if (sessionStorage.getItem(STORAGE_KEYS.OAUTH_PENDING_GOOGLE)) return true;
    return false;
  }, [state.hasServerSession]);

  const handleStateChange = useCallback((partial: Partial<OAuthState>) => {
    setState((s) => ({ ...s, ...partial }));
  }, []);

  useLayoutEffect(() => {
    void loadSession();
  }, [loadSession]);

  useLayoutEffect(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem(STORAGE_KEYS.OAUTH_LAST_DISPLAY_CODE);
    if (stored) setDisplayAuthCode(stored);
  }, []);

  useEffect(() => {
    const oauth = searchParams.get("oauth");
    const err = searchParams.get("oauth_error");
    const showCode = searchParams.get("show_code");
    if (oauth === "success") {
      if (showCode) {
        setDisplayAuthCode(showCode);
        sessionStorage.setItem(STORAGE_KEYS.OAUTH_LAST_DISPLAY_CODE, showCode);
      }
      void loadSession().then(() => {
        router.replace("/", { scroll: false });
      });
    }
    if (err) {
      setActionFeedback(`OAuth 錯誤：${decodeURIComponent(err)}`);
      router.replace("/", { scroll: false });
    }
  }, [searchParams, router, loadSession]);

  useEffect(() => {
    if (!actionFeedback) return;
    const t = setTimeout(() => setActionFeedback(null), 6500);
    return () => clearTimeout(t);
  }, [actionFeedback]);

  const handleLogout = useCallback(async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    sessionStorage.removeItem(STORAGE_KEYS.OAUTH_PENDING_GOOGLE);
    sessionStorage.removeItem(STORAGE_KEYS.OAUTH_LAST_DISPLAY_CODE);
    setDisplayAuthCode(null);
    setSessionUser(null);
    setState({});
  }, []);

  const clearBeforeNewPkce = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEYS.OAUTH_PENDING_GOOGLE);
    sessionStorage.removeItem(STORAGE_KEYS.OAUTH_LAST_DISPLAY_CODE);
    setDisplayAuthCode(null);
    setState({
      codeVerifier: undefined,
      codeChallenge: undefined,
      hasServerSession: false,
      oauthStartError: undefined,
    });
    setSessionUser(null);
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
            "已執行：前往 Google（verifier 寫入 HttpOnly）；在 Google 分頁完成同意"
          );
          scrollToId("section-oauth-flow");
          break;
        case 2:
          scrollToId("section-oauth-flow-visual");
          setActionFeedback(
            "換票與 session：見「視覺化」① ?code、② POST /token"
          );
          break;
        case 3:
          if (state.hasServerSession) {
            scrollToId("section-user-profile");
            setActionFeedback("已捲動到 Profile（UserInfo）");
          } else {
            setActionFeedback("尚無 session；請先完成 Google 登入。");
          }
          break;
        default:
          break;
      }
    },
    [state.hasServerSession]
  );

  return (
    <div className="flex h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                OAuth 2.1 PKCE Playground
              </h1>
              <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                換票在伺服器；session 為 HttpOnly cookie。受保護範例：{" "}
                <Link
                  href="/protected"
                  className="text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  /protected
                </Link>
              </p>
            </div>
          </header>

          {actionFeedback && (
            <p className="mb-6 text-sm text-amber-800 dark:text-amber-200 bg-amber-500/15 border border-amber-500/30 rounded-lg px-3 py-2">
              {actionFeedback}
            </p>
          )}

          <FlowStepSpotlight syncedStep={syncedStep} />

          <SequenceDiagram
            syncedStep={syncedStep}
            onStepAction={handleStepAction}
            actionFeedback={actionFeedback}
          />

          <AttackerPovPanel />

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
                  偵測到 OAuth 進行中或已登入（HttpOnly session）
                </p>
                <p className="text-xs text-amber-900/90 dark:text-amber-200/90">
                  請先<strong>清除 session</strong>
                  ，才能從 Live Cryptography 重新開始。
                </p>
                <button
                  type="button"
                  onClick={() => void handleLogout()}
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

            {state.oauthStartError && (
              <p className="mb-4 text-sm text-red-600 dark:text-red-400">
                無法開始登入：{state.oauthStartError}
              </p>
            )}

            {!hasActivePlaygroundSession && state.codeChallenge && (
              <OAuthFlow
                ref={oauthRef}
                codeVerifier={state.codeVerifier}
                codeChallenge={state.codeChallenge}
                sessionActive={state.hasServerSession}
                onStateChange={handleStateChange}
                onLogout={() => void handleLogout()}
              />
            )}

            <OAuthFlowVisual
              authorizationCode={displayAuthCode ?? undefined}
              codeVerifier={state.codeVerifier}
              clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}
              serverSessionActive={state.hasServerSession}
            />

            {state.hasServerSession && <UserProfile user={sessionUser} />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-white dark:bg-zinc-950 text-zinc-500">
          Loading…
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
