import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Routes that are always public — no auth required
const publicRoutes = [
  "/login",
  "/signup",
  "/complete-profile",
  "/verify-email",
  "/forgot-password",
  "/reset-password",
  "/auth/callback",
];

// Public routes where a fully-authenticated user should be sent to dashboard
// instead. /complete-profile and /auth/callback are excluded so they are
// never interrupted mid-flow.
const redirectIfVerified = [
  "/login",
  "/signup",
  "/forgot-password",
  "/reset-password",
];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  function redirect(path: string) {
    const url = request.nextUrl.clone();
    url.pathname = path;
    return NextResponse.redirect(url);
  }

  const isAuthenticated = !!user;
  const isVerified = !!user?.email_confirmed_at;

  // Dashboard only requires a valid session — no email-verified check here
  if (pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) return redirect("/login");
  }

  // Redirect already-verified users away from login/signup etc.
  // Never redirect from /complete-profile or /auth/callback.
  if (redirectIfVerified.includes(pathname)) {
    if (isAuthenticated && isVerified) return redirect("/dashboard");
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/login",
    "/signup",
    "/complete-profile",
    "/verify-email",
    "/forgot-password",
    "/reset-password",
    "/auth/callback",
  ],
};
