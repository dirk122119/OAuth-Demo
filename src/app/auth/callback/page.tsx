import Link from "next/link";

/** OAuth 實際 redirect 已改為 /api/auth/callback（Route Handler 換票）。此頁僅作說明。 */
export default function AuthCallbackInfoPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-8">
      <div className="max-w-lg space-y-4 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          /auth/callback
        </p>
        <h1 className="text-xl font-semibold">此路徑已不作 OAuth redirect</h1>
        <p className="text-sm text-zinc-400 leading-relaxed">
          請在 Google Cloud Console 將 Authorized redirect URI 設為{" "}
          <code className="text-emerald-400 break-all">
            http://localhost:3000/api/auth/callback
          </code>
          （正式環境請換成你的網域）。授權完成後會由{" "}
          <code className="text-emerald-400">/api/auth/callback</code> 換票並寫入
          HttpOnly session。
        </p>
        <Link
          href="/"
          className="inline-block text-emerald-400 hover:underline text-sm"
        >
          ← 回 Playground
        </Link>
      </div>
    </div>
  );
}
