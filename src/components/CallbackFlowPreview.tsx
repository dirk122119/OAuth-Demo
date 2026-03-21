"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { truncateDisplay } from "@/lib/oauthDisplay";

/**
 * /auth/callback：在真正 POST token 前，先讓使用者看到
 * ?code= 與即將送出的 form body（與首頁 OAuthFlowVisual 呼應）
 */
export function CallbackFlowPreview({
  code,
  codeVerifier,
  clientId,
  redirectUri,
  onProceed,
  autoDelayMs = 2800,
}: {
  code: string;
  codeVerifier: string;
  clientId: string;
  redirectUri: string;
  onProceed: () => void;
  autoDelayMs?: number;
}) {
  const totalSec = Math.max(1, Math.ceil(autoDelayMs / 1000));
  const [sec, setSec] = useState(totalSec);
  const doneRef = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const proceedOnce = useCallback(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    onProceed();
  }, [onProceed]);

  useEffect(() => {
    timeoutRef.current = setTimeout(proceedOnce, autoDelayMs);
    const interval = setInterval(() => {
      setSec((s) => Math.max(0, s - 1));
    }, 1000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      clearInterval(interval);
    };
  }, [autoDelayMs, proceedOnce]);

  const href =
    typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col items-center justify-center">
      <div className="max-w-2xl w-full space-y-6">
        <h1 className="text-xl font-bold text-center">
          Callback：先看見 <span className="text-emerald-400">?code</span> 與{" "}
          <span className="text-violet-400">POST /token</span>
        </h1>
        <p className="text-sm text-zinc-400 text-center">
          下方為本次真實參數（截斷顯示）。約 {sec}s 後自動換 token，或按按鈕立即繼續。
        </p>

        <div className="rounded-xl border border-zinc-700 bg-zinc-900/80 overflow-hidden">
          <div className="px-3 py-2 bg-zinc-800 border-b border-zinc-700 text-xs text-zinc-400">
            目前網址（含 query）— authorization_code 在 <code className="text-emerald-400">code</code>
          </div>
          <div className="p-4 font-mono text-xs break-all text-emerald-300">
            {href}
          </div>
        </div>

        <div className="rounded-xl border border-violet-600/40 bg-violet-950/40 overflow-hidden">
          <div className="px-3 py-2 border-b border-violet-800/50 bg-violet-900/30">
            <p className="text-xs font-semibold text-violet-200">
              即將送出：POST https://oauth2.googleapis.com/token
            </p>
            <p className="text-[10px] text-violet-400 mt-1">
              Content-Type: application/x-www-form-urlencoded
            </p>
          </div>
          <dl className="p-4 space-y-3 font-mono text-[11px]">
            <Row k="grant_type" v="authorization_code" />
            <Row k="code" v={truncateDisplay(code)} highlight />
            <Row k="code_verifier" v={truncateDisplay(codeVerifier)} highlight />
            <Row k="client_id" v={truncateDisplay(clientId, 20, 12)} />
            <Row k="redirect_uri" v={redirectUri} />
          </dl>
        </div>

        <div className="flex justify-center gap-3">
          <button
            type="button"
            onClick={proceedOnce}
            className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium"
          >
            立即換 token
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({
  k,
  v,
  highlight,
}: {
  k: string;
  v: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={
        highlight
          ? "rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-2"
          : ""
      }
    >
      <dt className="text-zinc-500">{k}</dt>
      <dd className="text-zinc-100 mt-1 break-all">{v}</dd>
    </div>
  );
}
