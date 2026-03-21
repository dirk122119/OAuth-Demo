"use client";

import { useState, useCallback, Suspense, useEffect } from "react";
import { LiveCrypto } from "@/components/LiveCrypto";
import { OAuthFlow } from "@/components/OAuthFlow";
import { StateSidebar, type OAuthState } from "@/components/StateSidebar";
import { STORAGE_KEYS } from "@/lib/google-oauth";

export default function Home() {
  const [state, setState] = useState<OAuthState>({});

  const handleStateChange = useCallback((partial: Partial<OAuthState>) => {
    setState((s) => ({ ...s, ...partial }));
  }, []);

  useEffect(() => {
    const raw = sessionStorage.getItem(STORAGE_KEYS.OAUTH_RESULT);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Partial<OAuthState>;
        setState((s) => ({ ...s, ...parsed }));
        sessionStorage.removeItem(STORAGE_KEYS.OAUTH_RESULT);
      } catch {
        sessionStorage.removeItem(STORAGE_KEYS.OAUTH_RESULT);
      }
    }
  }, []);

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

          <LiveCrypto onStateChange={handleStateChange} />
          <OAuthFlow
            codeVerifier={state.codeVerifier}
            codeChallenge={state.codeChallenge}
            onStateChange={handleStateChange}
          />
        </div>
      </main>
      <Suspense fallback={<aside className="w-72 shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 animate-pulse" />}>
        <StateSidebar state={state} />
      </Suspense>
    </div>
  );
}
