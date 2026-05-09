import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    const cookieStore = await cookies();

    // Buffer cookies so we can attach them to the redirect response
    const cookieBuffer: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
              cookieBuffer.push({ name, value, options });
            });
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code);

    if (session) {
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
        cookieBuffer.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        return res;
      }

      const destination = host.onboarding_complete ? "/dashboard" : "/onboarding";
      const res = NextResponse.redirect(new URL(destination, requestUrl.origin));
      cookieBuffer.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      return res;
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth_failed", requestUrl.origin));
}
