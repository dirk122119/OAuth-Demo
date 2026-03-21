"use client";

import {
  useEffect,
  useState,
  useCallback,
  Suspense,
  useMemo,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  exchangeCodeForTokens,
  STORAGE_KEYS,
  peekOAuthConfig,
} from "@/lib/google-oauth";
import { CallbackFlowPreview } from "@/components/CallbackFlowPreview";
import { SequenceDiagram } from "@/components/SequenceDiagram";
import { FlowStepSpotlight } from "@/components/FlowStepSpotlight";

type Ctx = {
  code: string;
  verifier: string;
  clientId: string;
  redirectUri: string;
};

function callbackDiagramStep(
  status: "loading" | "preview" | "exchanging" | "success" | "error",
  errorMsg: string
): number {
  switch (status) {
    case "exchanging":
      return 4;
    case "success":
      return 5;
    case "preview":
      return 3;
    case "error":
      if (errorMsg.includes("Missing")) return 3;
      return 4;
    default:
      return 3;
  }
}

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [ctx, setCtx] = useState<Ctx | null>(null);
  const [status, setStatus] = useState<
    "loading" | "preview" | "exchanging" | "success" | "error"
  >("loading");
  const [error, setError] = useState("");
  const [diagramFeedback, setDiagramFeedback] = useState<string | null>(null);

  const syncedStep = useMemo(
    () => callbackDiagramStep(status, error),
    [status, error]
  );

  useEffect(() => {
    if (!diagramFeedback) return;
    const t = setTimeout(() => setDiagramFeedback(null), 4500);
    return () => clearTimeout(t);
  }, [diagramFeedback]);

  useEffect(() => {
    const code = searchParams.get("code");
    const verifier =
      typeof window !== "undefined"
        ? sessionStorage.getItem(STORAGE_KEYS.PKCE_VERIFIER)
        : null;
    const cfg = peekOAuthConfig();

    if (!code || !verifier) {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(STORAGE_KEYS.OAUTH_PENDING_GOOGLE);
      }
      setStatus("error");
      setError(
        !code ? "Missing code in URL" : "Missing code_verifier (session expired?)"
      );
      return;
    }

    if (!cfg) {
      setStatus("error");
      setError("NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set");
      return;
    }

    setCtx({ code, verifier, clientId: cfg.clientId, redirectUri: cfg.redirectUri });
    setStatus("preview");
  }, [searchParams]);

  const runExchange = useCallback(() => {
    if (!ctx) return;
    setStatus("exchanging");
    exchangeCodeForTokens(ctx.code, ctx.verifier)
      .then((tokens) => {
        sessionStorage.removeItem(STORAGE_KEYS.PKCE_VERIFIER);
        sessionStorage.removeItem(STORAGE_KEYS.OAUTH_PENDING_GOOGLE);
        sessionStorage.setItem(
          STORAGE_KEYS.OAUTH_RESULT,
          JSON.stringify({
            authCode: ctx.code,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            idToken: tokens.id_token,
            codeVerifier: ctx.verifier,
          })
        );
        setStatus("success");
      })
      .catch((e) => {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(STORAGE_KEYS.OAUTH_PENDING_GOOGLE);
        }
        setStatus("error");
        setError(e instanceof Error ? e.message : String(e));
      });
  }, [ctx]);

  const goHome = useCallback(() => {
    router.replace("/");
  }, [router]);

  const handleDiagramStep = useCallback(
    (step: number) => {
      if (step <= 2) {
        router.push("/");
        return;
      }
      if (step === 3) {
        setDiagramFeedback(
          "此頁網址含 iss、code、scope、authuser、prompt… 等；authorization_code 在 code 參數。"
        );
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      if (step === 4) {
        if (status === "preview") {
          setDiagramFeedback("點下方紫色按鈕即可發送 POST /token。");
          document
            .getElementById("callback-send-token")
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          setDiagramFeedback(
            status === "exchanging"
              ? "正在向 Google 換 token…"
              : "請先完成上方「發送 POST」或檢查錯誤訊息。"
          );
        }
        return;
      }
      if (step >= 5) {
        router.push("/");
      }
    },
    [status, router]
  );

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-y-auto">
      <div className="max-w-4xl mx-auto px-4 py-6 pb-16">
        <header className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            /auth/callback
          </p>
          <h1 className="text-lg font-semibold text-zinc-100 mt-1">
            與 Playground 相同的 Synced Sequence Diagram
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            下方為此步（授權碼 / POST token）與圖同步；可點步驟按鈕，與首頁行為一致（0–2
            會回首頁）。
          </p>
        </header>

        <FlowStepSpotlight syncedStep={syncedStep} />

        <SequenceDiagram
          syncedStep={syncedStep}
          onStepAction={handleDiagramStep}
          actionFeedback={diagramFeedback}
        />

        <div className="border-t border-zinc-800 pt-8 mt-8 space-y-8">
          {status === "preview" && ctx && (
            <CallbackFlowPreview
              embedded
              code={ctx.code}
              codeVerifier={ctx.verifier}
              clientId={ctx.clientId}
              redirectUri={ctx.redirectUri}
              onSendTokenRequest={runExchange}
            />
          )}

          {status === "exchanging" && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mb-4" />
              <p>正在 POST /token（code + code_verifier）…</p>
            </div>
          )}

          {status === "success" && (
            <div className="rounded-2xl border border-emerald-500/40 bg-zinc-900/80 p-8 text-center shadow-xl shadow-emerald-500/10 max-w-md mx-auto">
              <p className="text-3xl mb-2" aria-hidden>
                ✓
              </p>
              <h2 className="text-xl font-semibold text-emerald-400 mb-2">
                已成功換得 token
              </h2>
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed">
                授權結果已暫存於此瀏覽器 session。確認後再回 Playground 查看
                Profile 與 State Inspector。
              </p>
              <button
                type="button"
                onClick={goHome}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium transition-colors"
              >
                回到 Playground
              </button>
            </div>
          )}

          {status === "error" && (
            <div className="text-center max-w-md mx-auto py-8">
              <p className="text-red-400 font-medium mb-2">Callback / Token 錯誤</p>
              <p className="text-zinc-400 text-sm mb-4">{error}</p>
              <a
                href="/"
                className="text-emerald-400 hover:underline inline-block"
              >
                ← 回 Playground
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
