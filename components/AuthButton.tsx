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

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    });

    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
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
  console.log('=== SIGN OUT START ===')
  console.log('Current user before sign out:', user?.email)
  console.log('Current localStorage keys:', Object.keys(localStorage))
  console.log('Current sessionStorage keys:', Object.keys(sessionStorage))
  
  try {
    console.log('Getting supabase client...')
    const supabaseClient = getSupabaseBrowserClient()
    
    console.log('Calling signOut with global scope...')
    const { error } = await supabaseClient.auth.signOut({ scope: 'global' })
    
    if (error) {
      console.error('Supabase signOut error:', error)
    } else {
      console.log('Supabase signOut successful')
    }
    
    console.log('Clearing localStorage...')
    localStorage.clear()
    console.log('Clearing sessionStorage...')
    sessionStorage.clear()
    
    console.log('All cleanup done, redirecting...')
    window.location.href = window.location.origin + '/?signout=' + Date.now()
    
  } catch (error) {
    console.error('Sign out error:', error)
    console.log('Force redirecting due to error...')
    window.location.href = window.location.origin + '/?signout=' + Date.now()
  }
  
  console.log('=== SIGN OUT END ===')
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
