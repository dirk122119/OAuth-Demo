"use client";

import { truncateDisplay } from "@/lib/oauthDisplay";

/**
 * /auth/callback：收到 ?code= 後先預覽，僅在使用者點按鈕時才 POST /token
 */
export function CallbackFlowPreview({
  code,
  codeVerifier,
  clientId,
  redirectUri,
  onSendTokenRequest,
  /** 與序列圖同頁時用：不要全螢幕置中 */
  embedded = false,
}: {
  code: string;
  codeVerifier: string;
  clientId: string;
  redirectUri: string;
  /** 手動觸發：POST oauth2.googleapis.com/token */
  onSendTokenRequest: () => void;
  embedded?: boolean;
}) {
  const href =
    typeof window !== "undefined" ? window.location.href : "";

  const shell =
    embedded
      ? "w-full text-zinc-100"
      : "min-h-screen bg-zinc-950 text-zinc-100 p-6 flex flex-col items-center justify-center";

  return (
    <div className={shell}>
      <div className="max-w-2xl w-full space-y-6 mx-auto">
        <h1 className="text-xl font-bold text-center">
          已收到 <span className="text-emerald-400">authorization_code</span>
        </h1>
        <p className="text-sm text-zinc-400 text-center leading-relaxed">
          網址可含 <code className="text-zinc-300">iss</code>、
          <code className="text-zinc-300">scope</code>、
          <code className="text-zinc-300">authuser</code> 等；重點是{" "}
          <code className="text-emerald-400">code</code>。
          <strong className="text-zinc-300"> 不會自動換 token</strong>
          —請確認後再點按鈕。
        </p>

        <div className="rounded-xl border border-zinc-700 bg-zinc-900/80 overflow-hidden">
          <div className="px-3 py-2 bg-zinc-800 border-b border-zinc-700 text-xs text-zinc-400">
            ① 目前網址（query 中的 <code className="text-emerald-400">code</code> 即
            authorization_code）
          </div>
          <div className="p-4 font-mono text-xs break-all text-emerald-300">
            {href}
          </div>
        </div>

        <div className="rounded-xl border border-violet-600/40 bg-violet-950/40 overflow-hidden">
          <div className="px-3 py-2 border-b border-violet-800/50 bg-violet-900/30">
            <p className="text-xs font-semibold text-violet-200">
              ② 按下按鈕後才會送出：POST https://oauth2.googleapis.com/token
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

        <div className="flex justify-center pt-2">
          <button
            id="callback-send-token"
            type="button"
            onClick={onSendTokenRequest}
            className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold shadow-lg shadow-violet-500/20 transition-colors"
          >
            發送 POST /token（code + code_verifier）
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
