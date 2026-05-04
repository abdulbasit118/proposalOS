"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase-client";
import type { User } from "@supabase/supabase-js";
import { useEffect, useMemo, useState } from "react";

export default function AuthButton() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

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
    setIsSigningIn(true);
    setSignInError(null);
    
    const redirectTo = `${window.location.origin}/auth/callback`;
    console.log('Starting sign in, redirectTo:', redirectTo);
    
    // 15 second timeout
    const timeoutId = setTimeout(() => {
      setIsSigningIn(false);
      setSignInError("Sign in timed out. Please try again.");
    }, 15000);
    
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      // Clear timeout if sign in completes quickly
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      setIsSigningIn(false);
      setSignInError("Sign in failed. Please try again.");
      console.error('Sign in error:', error);
    }
  };

  const handleSignOut = async () => {
  try {
    const supabaseClient = getSupabaseBrowserClient()
    const { error } = await supabaseClient.auth.signOut({ scope: 'global' })
    if (error) {
      console.error('Sign out error:', error)
    }
    localStorage.clear()
    sessionStorage.clear()
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/")
    })
    window.location.replace('/')
  } catch (error) {
    console.error('Sign out error:', error)
    window.location.replace('/')
  }
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
      <div className="space-y-2">
        <button
          type="button"
          onClick={signIn}
          disabled={isSigningIn}
          className="inline-flex items-center rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSigningIn ? "Signing in..." : "Sign in with Google"}
        </button>
        {signInError && (
          <p className="text-xs text-red-400">{signInError}</p>
        )}
      </div>
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
        onClick={handleSignOut}
        className="rounded-md border border-white/20 text-xs px-2 py-1 font-medium text-gray-200 transition hover:bg-white/10"
      >
        Sign out
      </button>
    </div>
  );
}
