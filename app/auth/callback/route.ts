import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  // Build the redirect response first so cookies can be attached to it directly.
  // Using next/headers cookies() here doesn't work — cookies set that way are
  // not included in an explicit NextResponse.redirect() object.
  const redirectUrl = next ? `${origin}${next}` : `${origin}/dashboard`;
  const response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Email verification flow — mark onboarding complete (skip for password reset)
  if (!next) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const svc = createServiceClient();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (svc.from("hosts") as any).update({ onboarding_complete: true }).eq("id", user.id);
    }
  }

  return response;
}
