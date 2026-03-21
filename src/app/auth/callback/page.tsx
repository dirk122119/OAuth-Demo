"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  exchangeCodeForTokens,
  STORAGE_KEYS,
} from "@/lib/google-oauth";

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<"exchanging" | "done" | "error">(
    "exchanging"
  );
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const code = searchParams.get("code");
    const verifier =
      typeof window !== "undefined"
        ? sessionStorage.getItem(STORAGE_KEYS.PKCE_VERIFIER)
        : null;

    if (!code || !verifier) {
      setStatus("error");
      setError(!code ? "Missing code in URL" : "Missing code_verifier (session expired?)");
      return;
    }

    exchangeCodeForTokens(code, verifier)
      .then((tokens) => {
        sessionStorage.removeItem(STORAGE_KEYS.PKCE_VERIFIER);
        sessionStorage.setItem(
          STORAGE_KEYS.OAUTH_RESULT,
          JSON.stringify({
            authCode: code,
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            idToken: tokens.id_token,
          })
        );
        setStatus("done");
        router.replace("/");
      })
      .catch((e) => {
        setStatus("error");
        setError(e instanceof Error ? e.message : String(e));
      });
  }, [searchParams, router]);

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

  return null; // redirecting
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
