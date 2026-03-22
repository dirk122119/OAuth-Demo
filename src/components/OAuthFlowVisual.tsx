"use client";

import { useEffect, useState, type ReactNode } from "react";
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

const EXAMPLE_CODE = "4/0AeDxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
const EXAMPLE_VERIFIER =
  "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";

/** 視覺化：redirect ?code 與 POST /token（換票實際在 Route Handler） */
export function OAuthFlowVisual({
  authorizationCode,
  codeVerifier,
  clientId,
  serverSessionActive,
}: {
  /** 本輪 callback 的真實 code（換票成功後由 redirect 帶入一次；無則用示意字串） */
  authorizationCode?: string;
  codeVerifier?: string;
  clientId?: string;
  /** 已由伺服器換票並寫入 HttpOnly session */
  serverSessionActive?: boolean;
}) {
  const [redirectUri, setRedirectUri] = useState("https://your-app/api/auth/callback");

  useEffect(() => {
    setRedirectUri(`${window.location.origin}/api/auth/callback`);
  }, []);

  if (!serverSessionActive) {
    return null;
  }

  const codeDisplay = authorizationCode ?? EXAMPLE_CODE;
  const codeIsReal = Boolean(authorizationCode);

  return (
    <section
      id="section-oauth-flow-visual"
      className="space-y-6 mt-10 scroll-mt-4"
    >
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        視覺化：?code 與 POST /token
      </h2>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Google 同意後會把 <code className="text-emerald-600 dark:text-emerald-400">authorization_code</code>{" "}
        帶到 <code className="text-xs">redirect_uri</code>；本專案由{" "}
        <strong>Next.js Route Handler</strong> 讀取 code 與 HttpOnly 裡的{" "}
        <code className="text-amber-600 dark:text-amber-400">code_verifier</code>
        ，在<strong>伺服器</strong>向 token 端點換票並寫入 session cookie。登入成功後①② 可顯示
        <strong>本輪真實</strong>
        <code className="text-xs"> code</code>（已換票，僅教學對照）；亦可對照 DevTools → Network。
      </p>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            ① Redirect 帶回（query）
            {codeIsReal ? (
              <span className="ml-2 text-emerald-600 dark:text-emerald-400 font-normal text-xs">
                本輪真實 code
              </span>
            ) : (
              <span className="ml-2 text-zinc-400 font-normal text-xs">示意</span>
            )}
          </h3>
          <UrlBar>
            <span className="text-zinc-500">{redirectUri}</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              ?code=
            </span>
            <span className="bg-emerald-500/15 dark:bg-emerald-500/20 px-0.5 rounded">
              {truncateDisplay(codeDisplay, 28, 12)}
            </span>
            <span className="text-zinc-500">（可能還有 &amp;scope=… 等）</span>
          </UrlBar>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {codeIsReal
              ? "此 code 已於伺服器換票，僅供與當次 POST body 對照；重新整理後仍可能從 sessionStorage 還原。"
              : "登入成功後會帶入本輪真實 code；否則為示意字串。"}
          </p>
        </div>

        <div className="space-y-2">
          <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            ② Token 交換（POST body，伺服器發送）
          </h3>
          <PostCard
            title="POST（Next.js → Google）"
            endpoint="https://oauth2.googleapis.com/token"
            rows={[
              { key: "grant_type", value: "authorization_code" },
              {
                key: "code",
                value: truncateDisplay(codeDisplay, 28, 12),
                highlight: true,
              },
              {
                key: "code_verifier",
                value: codeVerifier
                  ? truncateDisplay(codeVerifier)
                  : `（HttpOnly cookie「${EXAMPLE_VERIFIER.slice(0, 12)}…」由 Route Handler 讀取）`,
                highlight: true,
              },
              {
                key: "client_id",
                value: clientId ?? "YOUR_CLIENT_ID.apps.googleusercontent.com",
              },
              { key: "redirect_uri", value: redirectUri },
            ]}
          />
        </div>
      </div>
    </section>
  );
}
