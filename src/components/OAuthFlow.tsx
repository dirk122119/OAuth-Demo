"use client";

import { useCallback, forwardRef, useImperativeHandle } from "react";
import { STORAGE_KEYS } from "@/lib/google-oauth";
import type { OAuthState } from "./StateSidebar";

interface OAuthFlowProps {
  codeVerifier?: string;
  codeChallenge?: string;
  sessionActive?: boolean;
  onStateChange: (state: Partial<OAuthState>) => void;
  onLogout: () => void;
}

export type OAuthFlowHandle = {
  startLogin: () => void;
};

export const OAuthFlow = forwardRef<OAuthFlowHandle, OAuthFlowProps>(
  function OAuthFlow(
    {
      codeVerifier,
      codeChallenge,
      sessionActive,
      onStateChange,
      onLogout,
    },
    ref
  ) {
    const hasClientId = Boolean(
      typeof window !== "undefined" && process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    );
    const canLogin = Boolean(codeVerifier && codeChallenge && hasClientId);
    const isLoggedIn = Boolean(sessionActive);

    const startLogin = useCallback(async () => {
      if (!canLogin || !codeVerifier || !codeChallenge) return;
      sessionStorage.setItem(STORAGE_KEYS.OAUTH_PENDING_GOOGLE, "1");
      const res = await fetch("/api/auth/google/start", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codeVerifier,
          codeChallenge,
        }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        sessionStorage.removeItem(STORAGE_KEYS.OAUTH_PENDING_GOOGLE);
        onStateChange({
          oauthStartError: err.error ?? `HTTP ${res.status}`,
        });
        return;
      }
      const { url } = (await res.json()) as { url: string };
      window.location.href = url;
    }, [codeVerifier, codeChallenge, canLogin, onStateChange]);

    useImperativeHandle(
      ref,
      () => ({
        startLogin: () => {
          void startLogin();
        },
      }),
      [startLogin]
    );

    if (isLoggedIn) {
      return (
        <section id="section-oauth-flow" className="space-y-4">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            OAuth Flow
          </h2>
          <button
            onClick={onLogout}
            className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-sm font-medium transition-colors"
          >
            登出
          </button>
        </section>
      );
    }

    return (
      <section id="section-oauth-flow" className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          OAuth Flow
        </h2>
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => void startLogin()}
              disabled={!canLogin}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Login with Google
            </button>
            {!canLogin && (
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {!hasClientId
                  ? "Set NEXT_PUBLIC_GOOGLE_CLIENT_ID in .env.local"
                  : "Generate code_verifier first"}
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xl">
            PKCE verifier 會寫入 <strong>HttpOnly cookie</strong>（/api/auth/google/start），換票在{" "}
            <code className="text-zinc-600 dark:text-zinc-300">/api/auth/callback</code>{" "}
            由伺服器完成。
          </p>
        </div>
      </section>
    );
  }
);
