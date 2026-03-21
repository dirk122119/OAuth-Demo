"use client";

export const SEQUENCE_STEPS = [
  {
    id: 0,
    label: "Generate PKCE",
    detail: "Browser: code_verifier → SHA-256 → code_challenge",
    hintZh:
      "先在下方「Live Cryptography」按 Generate，產生 code_verifier 與 code_challenge。",
  },
  {
    id: 1,
    label: "Authorize",
    detail: "Redirect to accounts.google.com with code_challenge (S256)",
    hintZh:
      "在「OAuth Flow」按 Login with Google，瀏覽器會帶著 challenge 導向 Google。",
  },
  {
    id: 2,
    label: "User consents",
    detail: "Google stores challenge; user signs in & approves scopes",
    hintZh:
      "在 Google 頁面登入並同意授權（此步發生在 Google，不在本頁）。",
  },
  {
    id: 3,
    label: "Authorization code",
    detail: "Redirect to /auth/callback?code=…",
    hintZh:
      "同意後 Google 把你導回 /auth/callback，網址會帶 ?code= 授權碼。",
  },
  {
    id: 4,
    label: "Token request",
    detail: "POST oauth2.googleapis.com/token with code + code_verifier",
    hintZh:
      "Callback 頁會用 code + code_verifier POST 到 token 端點（畫面上會先預覽）。",
  },
  {
    id: 5,
    label: "Tokens",
    detail: "access_token, id_token (optional refresh_token)",
    hintZh: "Google 回傳 access_token（與可選的 id_token、refresh_token）。",
  },
  {
    id: 6,
    label: "UserInfo",
    detail: "GET userinfo with Bearer access_token",
    hintZh:
      "用 access_token 呼叫 UserInfo，下方會顯示大頭照與 email。",
  },
] as const;

type SequenceDiagramProps = {
  /** 依目前 OAuth 狀態自動對齊 */
  syncedStep: number;
  /** 點步驟時觸發對應動作 */
  onStepAction: (step: number) => void;
  /** 最近一次動作回饋 */
  actionFeedback?: string | null;
};

export function SequenceDiagram({
  syncedStep,
  onStepAction,
  actionFeedback,
}: SequenceDiagramProps) {
  const active = Math.min(6, Math.max(0, syncedStep));

  return (
    <section id="section-sequence-diagram" className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Synced Sequence Diagram (ROB-7)
      </h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        建議由上往下看：圖會依你目前狀態自動對齊步驟；點步驟按鈕可捲到對應區塊或觸發 Generate / Login。
      </p>

      {actionFeedback && (
        <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          {actionFeedback}
        </p>
      )}

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-900/50 p-4 overflow-x-auto">
        <svg
          viewBox="0 0 520 340"
          className="w-full max-w-2xl mx-auto text-zinc-800 dark:text-zinc-200"
          aria-hidden
        >
          <defs>
            <marker
              id="seq-arrowhead"
              markerWidth="8"
              markerHeight="8"
              refX="7"
              refY="4"
              orient="auto"
            >
              <polygon points="0 0, 8 4, 0 8" fill="currentColor" />
            </marker>
          </defs>

          <rect
            x="40"
            y="20"
            width="120"
            height="36"
            rx="8"
            className="fill-amber-500/15 stroke-amber-600 dark:stroke-amber-400"
            strokeWidth="1.5"
          />
          <text x="100" y="42" textAnchor="middle" className="fill-current text-sm font-medium">
            Browser
          </text>

          <rect
            x="360"
            y="20"
            width="120"
            height="36"
            rx="8"
            className="fill-emerald-500/15 stroke-emerald-600 dark:stroke-emerald-400"
            strokeWidth="1.5"
          />
          <text x="420" y="42" textAnchor="middle" className="fill-current text-sm font-medium">
            Google
          </text>

          <line x1="100" y1="56" x2="100" y2="320" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="4 4" />
          <line x1="420" y1="56" x2="420" y2="320" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="4 4" />

          <path
            d="M 100 80 L 60 80 L 60 115 L 140 115 L 140 80 L 100 80"
            fill="none"
            strokeWidth={active === 0 ? 3 : 1.5}
            className={active === 0 ? "stroke-amber-500" : "stroke-zinc-400 dark:stroke-zinc-500"}
            markerEnd="url(#seq-arrowhead)"
          />
          <text x="100" y="104" textAnchor="middle" className="fill-current text-[10px]">
            PKCE
          </text>

          <line
            x1="140"
            y1="140"
            x2="360"
            y2="140"
            strokeWidth={active === 1 ? 3 : 1.5}
            className={active === 1 ? "stroke-emerald-500" : "stroke-zinc-400 dark:stroke-zinc-500"}
            markerEnd="url(#seq-arrowhead)"
          />
          <text x="250" y="132" textAnchor="middle" className="fill-current text-[10px]">
            GET /auth + code_challenge
          </text>

          <rect
            x="300"
            y="155"
            width="200"
            height="28"
            rx="4"
            className={active === 2 ? "fill-violet-500/20 stroke-violet-500" : "fill-zinc-200/50 dark:fill-zinc-800/50 stroke-zinc-300 dark:stroke-zinc-600"}
            strokeWidth={active === 2 ? 2 : 1}
          />
          <text x="400" y="172" textAnchor="middle" className="fill-current text-[10px]">
            User consents
          </text>

          <line
            x1="360"
            y1="200"
            x2="140"
            y2="200"
            strokeWidth={active === 3 ? 3 : 1.5}
            className={active === 3 ? "stroke-emerald-500" : "stroke-zinc-400 dark:stroke-zinc-500"}
            markerEnd="url(#seq-arrowhead)"
          />
          <text x="250" y="192" textAnchor="middle" className="fill-current text-[10px]">
            ?code=authorization_code
          </text>

          <line
            x1="140"
            y1="235"
            x2="360"
            y2="235"
            strokeWidth={active === 4 ? 3 : 1.5}
            className={active === 4 ? "stroke-emerald-500" : "stroke-zinc-400 dark:stroke-zinc-500"}
            markerEnd="url(#seq-arrowhead)"
          />
          <text x="250" y="227" textAnchor="middle" className="fill-current text-[10px]">
            POST /token + code_verifier
          </text>

          <line
            x1="360"
            y1="265"
            x2="140"
            y2="265"
            strokeWidth={active === 5 ? 3 : 1.5}
            className={active === 5 ? "stroke-emerald-500" : "stroke-zinc-400 dark:stroke-zinc-500"}
            markerEnd="url(#seq-arrowhead)"
          />
          <text x="250" y="257" textAnchor="middle" className="fill-current text-[10px]">
            access_token JSON
          </text>

          <line
            x1="140"
            y1="295"
            x2="360"
            y2="295"
            strokeWidth={active === 6 ? 3 : 1.5}
            className={active === 6 ? "stroke-amber-500" : "stroke-zinc-400 dark:stroke-zinc-500"}
            markerEnd="url(#seq-arrowhead)"
          />
          <text x="250" y="287" textAnchor="middle" className="fill-current text-[10px]">
            GET /userinfo Bearer
          </text>
        </svg>
      </div>

      <div className="flex flex-wrap gap-2">
        {SEQUENCE_STEPS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onStepAction(s.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              active === s.id
                ? "bg-emerald-600 text-white ring-2 ring-emerald-400/50"
                : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 dark:hover:bg-zinc-700"
            }`}
          >
            {s.id + 1}. {s.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400 border-l-2 border-emerald-500 pl-3">
        <span className="text-zinc-500 dark:text-zinc-500 font-medium">目前步驟 {active + 1}：</span>
        {SEQUENCE_STEPS[active].detail}
      </p>
    </section>
  );
}
