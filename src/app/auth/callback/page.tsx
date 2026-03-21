"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  exchangeCodeForTokens,
  STORAGE_KEYS,
  peekOAuthConfig,
} from "@/lib/google-oauth";
import { CallbackFlowPreview } from "@/components/CallbackFlowPreview";

type Ctx = {
  code: string;
  verifier: string;
  clientId: string;
  redirectUri: string;
};

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [ctx, setCtx] = useState<Ctx | null>(null);
  const [status, setStatus] = useState<
    "loading" | "preview" | "exchanging" | "error" | "done"
  >("loading");
  const [error, setError] = useState("");

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
        setStatus("done");
        router.replace("/");
      })
      .catch((e) => {
        if (typeof window !== "undefined") {
          sessionStorage.removeItem(STORAGE_KEYS.OAUTH_PENDING_GOOGLE);
        }
        setStatus("error");
        setError(e instanceof Error ? e.message : String(e));
      });
  }, [ctx, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (status === "preview" && ctx) {
    return (
      <CallbackFlowPreview
        code={ctx.code}
        codeVerifier={ctx.verifier}
        clientId={ctx.clientId}
        redirectUri={ctx.redirectUri}
        onProceed={runExchange}
        autoDelayMs={2800}
      />
    );
  }

  if (status === "exchanging") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4" />
          <p>Exchanging code for tokens…</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-zinc-100">
        <div className="text-center max-w-md">
          <p className="text-red-400 font-medium mb-2">Token exchange failed</p>
          <p className="text-zinc-400 text-sm mb-4">{error}</p>
          <a
            href="/"
            className="text-emerald-400 hover:underline"
          >
            ← Back to Playground
          </a>
        </div>
      </div>
    );
  }

  return null;
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
