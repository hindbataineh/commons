import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=missing_code", request.url));
  }

  // Collect cookies set during exchangeCodeForSession so we can attach
  // them to whichever redirect response we ultimately return.
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
    return NextResponse.redirect(new URL("/login?error=auth_failed", request.url));
  }

  // Password reset or other ?next= flows — redirect there directly
  if (next) {
    const response = NextResponse.redirect(new URL(next, request.url));
    pendingCookies.forEach(({ name, value, options }) =>
      response.cookies.set(name, value, options)
    );
    return response;
  }

  // Use getSession() — reads locally from the cookies just set above,
  // more reliable than getUser() which makes a round-trip to Supabase.
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/login?error=no_session", request.url));
  }

  const userId = session.user.id;
  const userEmail = session.user.email || "";

  // Check if host already exists and has completed onboarding
  const svc = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: host } = await (svc.from("hosts") as any)
    .select("onboarding_complete")
    .eq("id", userId)
    .single();

  let destination: URL;

  if (host?.onboarding_complete) {
    destination = new URL("/dashboard", request.url);
  } else {
    // No host row or onboarding incomplete — go to complete-profile with params
    destination = new URL("/complete-profile", request.url);
    destination.searchParams.set("uid", userId);
    destination.searchParams.set("email", userEmail);
  }

  const response = NextResponse.redirect(destination);
  pendingCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options)
  );
  return response;
}
