import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { fetchGoogleUserInfo } from "@/lib/google-oauth-server";
import { OAUTH_INTERNAL_ACCESS_HEADER } from "@/lib/oauth-internal-headers";

export const dynamic = "force-dynamic";

export default async function ProtectedPage() {
  const h = await headers();
  const access = h.get(OAUTH_INTERNAL_ACCESS_HEADER);
  if (!access) redirect("/");

  let email = "";
  try {
    const info = await fetchGoogleUserInfo(access);
    email = info.email;
  } catch {
    email = "(UserInfo 失敗)";
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full rounded-2xl border border-emerald-500/40 bg-zinc-900/80 p-8 space-y-4">
        <p className="text-xs font-medium uppercase tracking-wide text-emerald-400">
          受保護路由（middleware 換發 access + 內部 header）
        </p>
        <h1 className="text-xl font-semibold">你已通過 oauth_session 驗證</h1>
        <p className="text-sm text-zinc-400">
          middleware 會在 access 將過期時用 refresh_token 換新 access，並可選更新
          Set-Cookie；本頁用內部 header 的 access 打 UserInfo（同請求內不讀過期
          cookie）。
        </p>
        <p className="text-sm font-mono text-zinc-300">
          UserInfo email: {email}
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
