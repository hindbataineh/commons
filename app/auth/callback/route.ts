import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    // Create a placeholder response — cookies will be written directly onto
    // whichever final redirect response we return
    const placeholderRes = NextResponse.redirect(new URL("/onboarding", requestUrl.origin));

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              placeholderRes.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code);

    if (session) {
      // Collect all cookies set during exchange so we can copy them to the
      // final redirect response
      const sessionCookies = placeholderRes.cookies.getAll();

      const svc = createServiceClient();

      const { data: host } = await svc
        .from("hosts")
        .select("id, onboarding_complete")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!host) {
        const { error: insertError } = await svc.from("hosts").insert({
          id: session.user.id,
          email: session.user.email ?? "",
          name: session.user.email?.split("@")[0] ?? "Host",
          onboarding_complete: false,
        });
        if (insertError) {
          console.error("Host row creation failed:", insertError);
        }
        const res = NextResponse.redirect(new URL("/onboarding", requestUrl.origin));
        sessionCookies.forEach(({ name, value, ...options }) => res.cookies.set(name, value, options));
        return res;
      }

      const destination = host.onboarding_complete ? "/dashboard" : "/onboarding";
      const res = NextResponse.redirect(new URL(destination, requestUrl.origin));
      sessionCookies.forEach(({ name, value, ...options }) => res.cookies.set(name, value, options));
      return res;
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth_failed", requestUrl.origin));
}
