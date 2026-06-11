import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

  // Dashboard requires authenticated + email verified
  if (pathname.startsWith("/dashboard")) {
    if (!isAuthenticated) return redirect("/login");
    if (!isVerified) return redirect("/verify-email");
  }

  // Verify-email requires authentication; complete-profile is intentionally
  // public so a freshly signed-up user is never blocked before their session
  // cookie is fully written (the API route still enforces auth server-side)
  if (pathname === "/verify-email") {
    if (!isAuthenticated) return redirect("/login");
  }

  // Public auth pages: redirect away if already signed in and verified
  const publicAuthPaths = ["/login", "/signup", "/forgot-password", "/reset-password"];
  if (publicAuthPaths.includes(pathname)) {
    if (isAuthenticated && isVerified) return redirect("/dashboard");
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/verify-email",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
  ],
};
