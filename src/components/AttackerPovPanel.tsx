"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "oauth_playground_attacker_mode";

type DemoResult =
  | {
      outcome: "rejected";
      summary: string;
      detail: string;
    }
  | {
      outcome: "unexpected_success";
      message: string;
    };

export function AttackerPovPanel() {
  const [attackerMode, setAttackerMode] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DemoResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setAttackerMode(sessionStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const persistMode = useCallback((on: boolean) => {
    setAttackerMode(on);
    if (typeof window !== "undefined") {
      if (on) sessionStorage.setItem(STORAGE_KEY, "1");
      else sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const runSimulation = useCallback(async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/demo/attacker-token-attempt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: codeInput.trim() || undefined,
        }),
      });
      const data = (await res.json()) as DemoResult & { error?: string };
      if (!res.ok) {
        setError(
          typeof data.error === "string" ? data.error : JSON.stringify(data)
        );
        return;
      }
      if (data.outcome === "rejected") {
        setResult(data);
      } else if (data.outcome === "unexpected_success") {
        setResult(data);
      } else {
        setError("Unexpected response");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [codeInput]);

  return (
    <section
      id="section-attacker-pov"
      className="mt-10 scroll-mt-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/80 dark:bg-rose-950/25 p-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-rose-950 dark:text-rose-100">
            Attacker POV — PKCE 防護示範
          </h2>
          <p className="text-xs text-rose-800/80 dark:text-rose-300/90 mt-1">
            ROB-8：模擬惡意端持有竊聽到的 <code className="text-[11px]">code</code>，但無法通過換票。
          </p>
        </div>
        <label className="inline-flex items-center gap-2 cursor-pointer select-none shrink-0">
          <span className="text-sm font-medium text-rose-900 dark:text-rose-200">
            Toggle Attacker Mode
          </span>
          <input
            type="checkbox"
            role="switch"
            aria-checked={attackerMode}
            checked={attackerMode}
            onChange={(e) => {
              persistMode(e.target.checked);
              setResult(null);
              setError(null);
            }}
            className="sr-only peer"
          />
          <span className="relative w-11 h-6 rounded-full bg-zinc-300 dark:bg-zinc-600 peer-checked:bg-rose-600 transition-colors after:absolute after:top-0.5 after:left-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5" />
        </label>
      </div>

      {attackerMode && (
        <div className="mt-5 space-y-4 text-sm text-rose-950/95 dark:text-rose-100/95">
          <div className="space-y-2 leading-relaxed text-rose-900/95 dark:text-rose-200/95">
            <p>
              <strong>情境</strong>：惡意 App、剪貼簿竊取、錯誤註冊的 redirect / OS
              app link 等，攻擊者可能拿到<strong>授權回傳 URL 裡的</strong>
              <code className="mx-0.5 text-[11px]">authorization_code</code>。
            </p>
            <p>
              <strong>PKCE</strong>：換票還需要與<strong>該次</strong>授權請求綁定的{" "}
              <code className="text-[11px]">code_verifier</code>（合法流程裡在 HttpOnly
              cookie / 原 client）。攻擊者隨機猜的 verifier 無法通過驗證。
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-rose-800 dark:text-rose-300">
              竊聽到的 code（可留空，使用示範假 code）
            </label>
            <input
              type="text"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="貼上 Network 裡 /api/auth/callback?code=… 或留空"
              className="w-full rounded-lg border border-rose-200 dark:border-rose-800 bg-white dark:bg-zinc-900 px-3 py-2 font-mono text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400"
            />
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={() => void runSimulation()}
            className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white text-sm font-medium transition-colors"
          >
            {loading ? "請求中…" : "模擬攻擊者換票（錯誤 verifier → Google）"}
          </button>

          {error && (
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          )}

          {result?.outcome === "rejected" && (
            <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 dark:bg-emerald-950/40 px-3 py-3 space-y-2">
              <p className="text-sm font-medium text-emerald-900 dark:text-emerald-200">
                Auth Server 拒絕換票（預期）
              </p>
              <p className="text-xs text-emerald-900/90 dark:text-emerald-200/90">
                {result.summary}
              </p>
              <pre className="text-[11px] font-mono text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-all overflow-x-auto">
                {result.detail}
              </pre>
            </div>
          )}

          {result?.outcome === "unexpected_success" && (
            <p className="text-sm text-amber-800 dark:text-amber-200">
              {result.message}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
