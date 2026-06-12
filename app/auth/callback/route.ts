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

  // Collect cookies during exchangeCodeForSession so we can apply them to
  // whichever redirect response we create after determining the destination.
  const pendingCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

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
            pendingCookies.push({ name, value, options: options as Record<string, unknown> });
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Password reset or other ?next= flows — redirect there directly
  if (next) {
    const response = NextResponse.redirect(`${origin}${next}`);
    pendingCookies.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options)
    );
    return response;
  }

  // Email verification flow — check if host has completed onboarding
  const { data: { user } } = await supabase.auth.getUser();

  let redirectPath = "/login?error=no_user";

  if (user) {
    const svc = createServiceClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: host } = await (svc.from("hosts") as any)
      .select("onboarding_complete")
      .eq("id", user.id)
      .single();

    if (host?.onboarding_complete) {
      redirectPath = "/dashboard";
    } else {
      // Host row missing or onboarding incomplete — send back to complete-profile
      redirectPath = `/complete-profile?uid=${encodeURIComponent(user.id)}&email=${encodeURIComponent(user.email ?? "")}`;
    }
  }

  const response = NextResponse.redirect(`${origin}${redirectPath}`);
  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options)
  );
  return response;
}
