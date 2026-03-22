"use client";

import { useSearchParams } from "next/navigation";
import { SEQUENCE_STEPS } from "@/components/SequenceDiagram";

export interface OAuthState {
  codeVerifier?: string;
  codeChallenge?: string;
  /** 已用 HttpOnly session 登入（瀏覽器不持有 token 字串） */
  hasServerSession?: boolean;
  /** /api/auth/google/start 失敗訊息 */
  oauthStartError?: string;
}

export function StateSidebar({
  state,
  syncedStep,
}: {
  state: OAuthState;
  /** 0–3，與 SEQUENCE_STEPS / deriveOAuthStep 一致 */
  syncedStep: number;
}) {
  const searchParams = useSearchParams();
  const activeStep = Math.min(3, Math.max(0, syncedStep));
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
        {state.oauthStartError ? (
          <div
            role="alert"
            className="rounded-lg border border-red-500/40 bg-red-500/10 dark:bg-red-950/40 px-3 py-2 font-sans text-red-950 dark:text-red-100"
          >
            <p className="text-xs font-semibold mb-1">OAuth 初始化失敗</p>
            <p className="text-xs break-words whitespace-pre-wrap">
              {state.oauthStartError}
            </p>
          </div>
        ) : null}

        <section className="font-sans" aria-label="OAuth flow steps">
          <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">
            Flow steps（1–4）
          </h4>
          <ol className="space-y-2 list-none m-0 p-0">
            {SEQUENCE_STEPS.map((step, i) => {
              const done = i < activeStep;
              const current = i === activeStep;
              return (
                <li
                  key={step.id}
                  aria-current={current ? "step" : undefined}
                  className={[
                    "rounded-lg border px-2.5 py-2 text-xs transition-colors",
                    current
                      ? "border-emerald-500/60 bg-emerald-500/10 dark:bg-emerald-950/40 ring-1 ring-emerald-500/30"
                      : done
                        ? "border-zinc-200/80 dark:border-zinc-700/80 bg-white/40 dark:bg-zinc-900/30 opacity-90"
                        : "border-dashed border-zinc-200 dark:border-zinc-700 bg-transparent opacity-70",
                  ].join(" ")}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={[
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                        done
                          ? "bg-emerald-600 text-white"
                          : current
                            ? "bg-emerald-500 text-white"
                            : "border border-zinc-300 dark:border-zinc-600 text-zinc-500 dark:text-zinc-400",
                      ].join(" ")}
                      aria-hidden
                    >
                      {done ? "✓" : i + 1}
                    </span>
                    <div className="min-w-0">
                      <p
                        className={[
                          "font-semibold",
                          current
                            ? "text-emerald-900 dark:text-emerald-100"
                            : "text-zinc-800 dark:text-zinc-100",
                        ].join(" ")}
                      >
                        {step.label}
                        {current ? (
                          <span className="ml-1.5 font-normal text-emerald-700 dark:text-emerald-300">
                            · 目前
                          </span>
                        ) : null}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                        {step.hintZh}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

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
