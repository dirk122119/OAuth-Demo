"use client";

import type { ReactNode } from "react";
import { truncateDisplay } from "@/lib/oauthDisplay";

function UrlBar({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-zinc-300 dark:border-zinc-600 bg-zinc-100 dark:bg-zinc-900 overflow-hidden font-mono text-xs">
      <div className="flex items-center gap-2 px-2 py-1.5 bg-zinc-200/80 dark:bg-zinc-800/80 border-b border-zinc-300 dark:border-zinc-600">
        <span className="text-zinc-500 dark:text-zinc-400 shrink-0">🔒</span>
        <span className="text-zinc-500 dark:text-zinc-400 text-[10px] uppercase tracking-wide">
          Address bar
        </span>
      </div>
      <div className="px-3 py-2 break-all text-zinc-800 dark:text-zinc-100 leading-relaxed">
        {children}
      </div>
    </div>
  );
}

function PostCard({
  title,
  endpoint,
  rows,
}: {
  title: string;
  endpoint: string;
  rows: { key: string; value: string; highlight?: boolean }[];
}) {
  return (
    <div className="rounded-lg border border-violet-300/60 dark:border-violet-600/50 bg-violet-50/50 dark:bg-violet-950/30 overflow-hidden">
      <div className="px-3 py-2 border-b border-violet-200 dark:border-violet-800 bg-violet-100/80 dark:bg-violet-900/40">
        <p className="text-[11px] font-semibold text-violet-900 dark:text-violet-200">
          {title}
        </p>
        <p className="font-mono text-[11px] text-violet-700 dark:text-violet-300 mt-1 break-all">
          {endpoint}
        </p>
        <p className="text-[10px] text-violet-600/90 dark:text-violet-400 mt-1">
          Content-Type: application/x-www-form-urlencoded
        </p>
      </div>
      <dl className="p-3 space-y-2 font-mono text-[11px]">
        {rows.map(({ key, value, highlight }) => (
          <div
            key={key}
            className={
              highlight
                ? "rounded-md bg-emerald-500/15 dark:bg-emerald-500/20 px-2 py-1.5 border border-emerald-500/30"
                : ""
            }
          >
            <dt className="text-zinc-500 dark:text-zinc-400">{key}</dt>
            <dd className="text-zinc-900 dark:text-zinc-100 break-all mt-0.5">
              {value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/** 首頁：教學 + 若有 authCode 則顯示本次摘要 */
export function OAuthFlowVisual({
  authCode,
  codeVerifier,
  clientId,
}: {
  authCode?: string;
  /** 多數情況登入後未保留；若有則一併展示 */
  codeVerifier?: string;
  clientId?: string;
}) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://your-app";
  const redirectUri = `${origin}/auth/callback`;
  const exampleCode = "4/0AeDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
  const exampleVerifier =
    "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";

  const hasSession = Boolean(authCode);

  return (
    <section
      id="section-oauth-flow-visual"
      className="space-y-6 mt-10 scroll-mt-4"
    >
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        視覺化：?code 與 POST /token
      </h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Google 同意後會<strong>用網址</strong>把 <code className="text-emerald-600 dark:text-emerald-400">authorization_code</code>{" "}
        帶回你的 <code className="text-xs">redirect_uri</code>；接著瀏覽器用{" "}
        <strong>POST</strong> 把 <code className="text-amber-600 dark:text-amber-400">code</code> 與{" "}
        <code className="text-amber-600 dark:text-amber-400">code_verifier</code> 一起送給 token
        端點換 access token（PKCE 驗證就在這裡）。
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            ① Redirect 帶回（query）
          </h3>
          <UrlBar>
            <span className="text-zinc-500">{redirectUri}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              ?code=
            </span>
            <span className="bg-emerald-500/15 dark:bg-emerald-500/20 px-0.5 rounded">
              {hasSession ? truncateDisplay(authCode!) : exampleCode}
            </span>
            <span className="text-zinc-500">（可能還有 &amp;scope=… 等）</span>
          </UrlBar>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            這就是「授權碼」：只出現在網址或伺服器日誌，不該當長期秘密存。
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            ② Token 交換（POST body）
          </h3>
          <PostCard
            title="POST（瀏覽器 → Google）"
            endpoint="https://oauth2.googleapis.com/token"
            rows={[
              {
                key: "grant_type",
                value: "authorization_code",
              },
              {
                key: "code",
                value: hasSession
                  ? truncateDisplay(authCode!)
                  : exampleCode,
                highlight: true,
              },
              {
                key: "code_verifier",
                value: codeVerifier
                  ? truncateDisplay(codeVerifier)
                  : hasSession
                    ? "（登入時已從 sessionStorage 讀出並送出，此處未保留）"
                    : truncateDisplay(exampleVerifier),
                highlight: true,
              },
              {
                key: "client_id",
                value: clientId ?? "YOUR_CLIENT_ID.apps.googleusercontent.com",
              },
              {
                key: "redirect_uri",
                value: redirectUri,
              },
            ]}
          />
        </div>
      </div>

      {!hasSession && (
        <p className="text-xs text-zinc-500 dark:text-zinc-500 border-l-2 border-zinc-300 dark:border-zinc-600 pl-3">
          完成一次 Google 登入後，左側網址列與 POST 的 <code>code</code> 會顯示你這次的真實片段（截斷顯示）。
        </p>
      )}
    </section>
  );
}
