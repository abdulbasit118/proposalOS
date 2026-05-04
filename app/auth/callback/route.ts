import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

// IMPORTANT: Add these in Supabase Dashboard
// Authentication → URL Configuration:
// Site URL: https://proposal-os-ruby.vercel.app
// Redirect URLs:
// https://proposal-os-ruby.vercel.app/auth/callback
// http://localhost:3000/auth/callback

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // If no code, redirect with error
  if (!code) {
    console.error('No code provided in auth callback');
    return NextResponse.redirect(new URL("/?error=no_code", origin));
  }

  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          },
        },
      },
    );
    
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Auth exchange error:', error);
      return NextResponse.redirect(new URL("/?error=auth_failed", origin));
    }
    
    // Success - redirect to home
    return NextResponse.redirect(new URL("/", origin));
  } catch (error) {
    console.error('Auth callback error:', error);
    return NextResponse.redirect(new URL("/?error=auth_failed", origin));
  }
}
