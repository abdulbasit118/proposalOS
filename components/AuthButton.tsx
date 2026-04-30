"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase-client";
import type { User } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";

export default function AuthButton() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      if (mounted) {
        setUser(currentUser);
        setIsLoading(false);
      }
    };

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const signIn = async () => {
    const redirectTo = `${window.location.origin}/auth/callback`;
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-xs text-gray-300">
        Checking session...
      </div>
    );
  }

  if (!user) {
    return (
      <button
        type="button"
        onClick={signIn}
        className="inline-flex items-center rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400"
      >
        Sign in with Google
      </button>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined;

  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/15 bg-[#1a1a1a] px-3 py-2 overflow-x-hidden">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="User avatar" className="h-8 w-8 rounded-full border border-white/20" />
      ) : (
        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-white/10 text-xs font-semibold">
          {user.email?.slice(0, 1).toUpperCase() ?? "U"}
        </div>
      )}
      <div className="max-w-[120px] truncate overflow-hidden whitespace-nowrap">
        <span className="hidden sm:inline text-xs text-gray-200 sm:text-sm">{user.email}</span>
      </div>
      <button
        type="button"
        onClick={signOut}
        className="rounded-md border border-white/20 text-xs px-2 py-1 font-medium text-gray-200 transition hover:bg-white/10"
      >
        Sign out
      </button>
    </div>
  );
}
