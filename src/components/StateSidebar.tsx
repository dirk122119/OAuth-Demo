"use client";

import { useSearchParams } from "next/navigation";

export interface OAuthState {
  codeVerifier?: string;
  codeChallenge?: string;
  /** 已用 HttpOnly session 登入（瀏覽器不持有 token 字串） */
  hasServerSession?: boolean;
  /** /api/auth/google/start 失敗訊息 */
  oauthStartError?: string;
}

export function StateSidebar({ state }: { state: OAuthState }) {
  const searchParams = useSearchParams();
  const urlParams: Record<string, string> = {};
  searchParams.forEach((v, k) => {
    urlParams[k] = v;
  });
  const entries = Object.entries(urlParams);
  const hasState = Object.keys(state).some((k) => {
    const v = state[k as keyof OAuthState];
    return v !== undefined && v !== "";
  });

  return (
    <aside
      id="state-sidebar"
      className="w-72 shrink-0 border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex flex-col overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          State Inspector
        </h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-mono text-sm">
        <section>
          <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
            URL Parameters
          </h4>
          {entries.length === 0 ? (
            <p className="text-zinc-400 dark:text-zinc-500 text-xs italic">
              No query params
            </p>
          ) : (
            <dl className="space-y-1.5">
              {entries.map(([k, v]) => (
                <div key={k} className="break-all">
                  <dt className="text-zinc-600 dark:text-zinc-400">{k}</dt>
                  <dd className="text-zinc-900 dark:text-zinc-100 truncate" title={v}>
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <section>
          <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
            PKCE & Tokens
          </h4>
          {!hasState ? (
            <p className="text-zinc-400 dark:text-zinc-500 text-xs italic">
              Generate verifier to populate
            </p>
          ) : (
            <dl className="space-y-1.5">
              {state.codeVerifier && (
                <div>
                  <dt className="text-zinc-600 dark:text-zinc-400">code_verifier</dt>
                  <dd className="text-amber-700 dark:text-amber-400 truncate text-xs" title={state.codeVerifier}>
                    {state.codeVerifier.slice(0, 16)}…
                  </dd>
                </div>
              )}
              {state.codeChallenge && (
                <div>
                  <dt className="text-zinc-600 dark:text-zinc-400">code_challenge</dt>
                  <dd className="text-emerald-700 dark:text-emerald-400 truncate text-xs" title={state.codeChallenge}>
                    {state.codeChallenge.slice(0, 20)}…
                  </dd>
                </div>
              )}
              {state.hasServerSession && (
                <div>
                  <dt className="text-zinc-600 dark:text-zinc-400">session</dt>
                  <dd className="text-green-700 dark:text-green-400 text-xs">
                    HttpOnly cookie（oauth_session）
                  </dd>
                </div>
              )}
            </dl>
          )}
        </section>
      </div>
    </aside>
  );
}
