import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_API_ROUTES = new Set(["/api/generate-proposal", "/api/match-score"]);

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value));
          res = NextResponse.next({
            request: {
              headers: req.headers,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    },
  );

  // Refreshes the auth session cookie if needed.
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // Check for guest mode header to skip authentication
  const isGuestMode = req.headers.get("x-guest-mode") === "true";

  if (PROTECTED_API_ROUTES.has(req.nextUrl.pathname) && !session && !isGuestMode) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
