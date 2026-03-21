"use client";

import { useEffect, useState } from "react";
import { fetchUserInfo } from "@/lib/google-oauth";

interface UserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
}

export function UserProfile({ accessToken }: { accessToken: string }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    fetchUserInfo(accessToken)
      .then((data) =>
        setUser({
          id: data.id,
          email: data.email,
          name: data.name,
          picture: data.picture,
          given_name: data.given_name,
          family_name: data.family_name,
        })
      )
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) {
    return (
      <section id="section-user-profile" className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Profile (access_token)
        </h2>
        <div className="flex items-center gap-3 text-zinc-500">
          <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-700 animate-pulse" />
          <div className="space-y-1">
            <div className="h-4 w-24 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
            <div className="h-3 w-32 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="section-user-profile" className="space-y-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          Profile (access_token)
        </h2>
        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
      </section>
    );
  }

  if (!user) return null;

  return (
    <section id="section-user-profile" className="space-y-4">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Profile (access_token)
      </h2>
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
          <p className="text-xs text-zinc-500 dark:text-zinc-500 font-mono mt-1">
            ID: {user.id}
          </p>
        </div>
      </div>
    </section>
  );
}
