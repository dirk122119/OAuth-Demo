"use client";

interface SessionUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export function UserProfile({ user }: { user: SessionUser | null }) {
  if (!user) return null;

  return (
    <section id="section-user-profile" className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Profile（UserInfo，經 /api/auth/session）
      </h2>
      <p className="text-xs text-zinc-500 dark:text-zinc-400">
        access_token 僅在伺服器讀 HttpOnly session，經由後端打 Google UserInfo。
      </p>
      <div className="flex items-center gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/50">
        {user.picture && (
          <img
            src={user.picture}
            alt={user.name}
            className="w-14 h-14 rounded-full"
          />
        )}
        <div className="min-w-0">
          <p className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
            {user.name}
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 truncate">
            {user.email}
          </p>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            ID: {user.id}
          </p>
        </div>
      </div>
    </section>
  );
}
