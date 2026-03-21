"use client";

export const SEQUENCE_STEPS = [
  {
    id: 0,
    label: "PKCE",
    detail: "Browser: code_verifier → SHA-256 → code_challenge",
    hintZh:
      "在「Live Cryptography」按 Generate，產生 verifier / challenge。",
  },
  {
    id: 1,
    label: "Sign in with Google",
    detail:
      "POST /api/auth/google/start → redirect Google → 使用者同意 → 302 帶 code 回 /api/auth/callback",
    hintZh:
      "按 Login：HttpOnly 存 verifier；在 Google 登入並同意；同意後瀏覽器帶 ?code= 打 callback（見 Network）。",
  },
  {
    id: 2,
    label: "Exchange & session",
    detail:
      "Route Handler：code + HttpOnly verifier → POST Google /token → Set-Cookie oauth_session → redirect",
    hintZh:
      "換票與 cookie 全在伺服器。下方「視覺化」①② 對照 ?code 與 POST /token。",
  },
  {
    id: 3,
    label: "UserInfo",
    detail:
      "GET /api/auth/session → App 用 access 打 userinfo → 200 { user } 給瀏覽器",
    hintZh:
      "已登入後由後端取 profile；或造訪 /protected。",
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
  const active = Math.min(3, Math.max(0, syncedStep));

  return (
    <section id="section-sequence-diagram" className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Synced Sequence Diagram（4 步）
      </h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        圖會依狀態對齊；點步驟可捲到對應區塊。③ 換票細節見下方「
        <a
          href="#section-oauth-flow-visual"
          className="text-emerald-600 dark:text-emerald-400 underline underline-offset-2"
        >
          視覺化：?code 與 POST /token
        </a>
        」。
      </p>

      {actionFeedback && (
        <p className="text-sm text-amber-700 dark:text-amber-400 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          {actionFeedback}
        </p>
      )}

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/80 dark:bg-zinc-900/50 p-4 overflow-x-auto">
        <svg
          viewBox="0 0 560 430"
          className="w-full max-w-3xl mx-auto text-zinc-800 dark:text-zinc-200"
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

          {/* Participants */}
          <rect
            x="16"
            y="14"
            width="118"
            height="34"
            rx="8"
            className="fill-amber-500/15 stroke-amber-600 dark:stroke-amber-400"
            strokeWidth="1.5"
          />
          <text x="75" y="35" textAnchor="middle" className="fill-current text-sm font-medium">
            Browser
          </text>

          <rect
            x="198"
            y="14"
            width="124"
            height="34"
            rx="8"
            className="fill-sky-500/15 stroke-sky-600 dark:stroke-sky-400"
            strokeWidth="1.5"
          />
          <text x="260" y="35" textAnchor="middle" className="fill-current text-sm font-medium">
            Next.js App
          </text>

          <rect
            x="386"
            y="14"
            width="118"
            height="34"
            rx="8"
            className="fill-emerald-500/15 stroke-emerald-600 dark:stroke-emerald-400"
            strokeWidth="1.5"
          />
          <text x="445" y="35" textAnchor="middle" className="fill-current text-sm font-medium">
            Google
          </text>

          {/* Lifelines */}
          <line x1="75" y1="52" x2="75" y2="412" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="4 4" />
          <line x1="260" y1="52" x2="260" y2="412" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="4 4" />
          <line x1="445" y1="52" x2="445" y2="412" stroke="currentColor" strokeOpacity="0.2" strokeDasharray="4 4" />

          {/* Step 0: PKCE in browser */}
          <path
            d="M 75 78 L 40 78 L 40 108 L 110 108 L 110 78 L 75 78"
            fill="none"
            strokeWidth={active === 0 ? 3 : 1.5}
            className={active === 0 ? "stroke-amber-500" : "stroke-zinc-400 dark:stroke-zinc-500"}
            markerEnd="url(#seq-arrowhead)"
          />
          <text x="75" y="100" textAnchor="middle" className="fill-current text-[9px]">
            PKCE (verifier → challenge)
          </text>

          {/* Step 1: start + redirect */}
          <line
            x1="75"
            y1="124"
            x2="260"
            y2="124"
            strokeWidth={active === 1 ? 3 : 1.5}
            className={active === 1 ? "stroke-sky-500" : "stroke-zinc-400 dark:stroke-zinc-500"}
            markerEnd="url(#seq-arrowhead)"
          />
          <text x="167" y="118" textAnchor="middle" className="fill-current text-[9px]">
            POST /api/auth/google/start
          </text>

          <line
            x1="260"
            y1="138"
            x2="75"
            y2="138"
            strokeWidth={active === 1 ? 3 : 1.5}
            strokeDasharray={active === 1 ? undefined : "5 4"}
            className={active === 1 ? "stroke-sky-500" : "stroke-zinc-400 dark:stroke-zinc-500"}
            markerEnd="url(#seq-arrowhead)"
          />
          <text x="167" y="132" textAnchor="middle" className="fill-current text-[9px]">
            url + Set-Cookie verifier
          </text>

          <line
            x1="75"
            y1="152"
            x2="445"
            y2="152"
            strokeWidth={active === 1 ? 3 : 1.5}
            className={active === 1 ? "stroke-emerald-500" : "stroke-zinc-400 dark:stroke-zinc-500"}
            markerEnd="url(#seq-arrowhead)"
          />
          <text x="260" y="146" textAnchor="middle" className="fill-current text-[9px]">
            GET /auth ?code_challenge (S256)
          </text>

          {/* Step 2: consent */}
          <rect
            x="378"
            y="164"
            width="134"
            height="28"
            rx="4"
            className={active === 1 ? "fill-violet-500/20 stroke-violet-500" : "fill-zinc-200/50 dark:fill-zinc-800/50 stroke-zinc-300 dark:stroke-zinc-600"}
            strokeWidth={active === 1 ? 2 : 1}
          />
          <text x="445" y="182" textAnchor="middle" className="fill-current text-[9px]">
            User consents
          </text>

          {/* Step 2: callback */}
          <line
            x1="75"
            y1="210"
            x2="260"
            y2="210"
            strokeWidth={active === 2 ? 3 : 1.5}
            className={active === 2 ? "stroke-sky-500" : "stroke-zinc-400 dark:stroke-zinc-500"}
            markerEnd="url(#seq-arrowhead)"
          />
          <text x="167" y="204" textAnchor="middle" className="fill-current text-[9px]">
            GET /api/auth/callback?code=
          </text>

          {/* Step 2 cont.: token (server → Google) */}
          <line
            x1="260"
            y1="238"
            x2="445"
            y2="238"
            strokeWidth={active === 2 ? 3 : 1.5}
            className={active === 2 ? "stroke-emerald-500" : "stroke-zinc-400 dark:stroke-zinc-500"}
            markerEnd="url(#seq-arrowhead)"
          />
          <text x="352" y="232" textAnchor="middle" className="fill-current text-[9px]">
            POST /token (code + verifier)
          </text>

          {/* Step 2 cont.: tokens back + session cookie */}
          <line
            x1="445"
            y1="266"
            x2="260"
            y2="266"
            strokeWidth={active === 2 ? 3 : 1.5}
            className={active === 2 ? "stroke-emerald-500" : "stroke-zinc-400 dark:stroke-zinc-500"}
            markerEnd="url(#seq-arrowhead)"
          />
          <text x="352" y="260" textAnchor="middle" className="fill-current text-[9px]">
            token JSON
          </text>

          <line
            x1="260"
            y1="284"
            x2="75"
            y2="284"
            strokeWidth={active === 2 ? 3 : 1.5}
            className={active === 2 ? "stroke-sky-500" : "stroke-zinc-400 dark:stroke-zinc-500"}
            markerEnd="url(#seq-arrowhead)"
          />
          <text x="167" y="278" textAnchor="middle" className="fill-current text-[9px]">
            Set-Cookie oauth_session + redirect
          </text>

          {/* Step 3: session → userinfo → profile back → JSON to browser */}
          <line
            x1="75"
            y1="308"
            x2="260"
            y2="308"
            strokeWidth={active === 3 ? 3 : 1.5}
            className={active === 3 ? "stroke-amber-500" : "stroke-zinc-400 dark:stroke-zinc-500"}
            markerEnd="url(#seq-arrowhead)"
          />
          <text x="167" y="302" textAnchor="middle" className="fill-current text-[9px]">
            GET /api/auth/session (cookie)
          </text>

          <line
            x1="260"
            y1="326"
            x2="445"
            y2="326"
            strokeWidth={active === 3 ? 3 : 1.5}
            className={active === 3 ? "stroke-emerald-500" : "stroke-zinc-400 dark:stroke-zinc-500"}
            markerEnd="url(#seq-arrowhead)"
          />
          <text x="352" y="320" textAnchor="middle" className="fill-current text-[9px]">
            GET oauth2/v2/userinfo
          </text>

          <line
            x1="445"
            y1="344"
            x2="260"
            y2="344"
            strokeWidth={active === 3 ? 3 : 1.5}
            className={active === 3 ? "stroke-emerald-500" : "stroke-zinc-400 dark:stroke-zinc-500"}
            markerEnd="url(#seq-arrowhead)"
            strokeDasharray={active === 3 ? undefined : "5 4"}
          />
          <text x="352" y="338" textAnchor="middle" className="fill-current text-[9px]">
            200 profile JSON (email, name, …)
          </text>

          <line
            x1="260"
            y1="362"
            x2="75"
            y2="362"
            strokeWidth={active === 3 ? 3 : 1.5}
            className={active === 3 ? "stroke-sky-500" : "stroke-zinc-400 dark:stroke-zinc-500"}
            markerEnd="url(#seq-arrowhead)"
            strokeDasharray={active === 3 ? undefined : "5 4"}
          />
          <text x="167" y="356" textAnchor="middle" className="fill-current text-[9px]">
            {"200 { authenticated, user }"}
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
