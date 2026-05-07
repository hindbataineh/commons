import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

const BASE_URL = "https://commons-khaki.vercel.app";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${BASE_URL}/login?error=auth_failed`);
  }

  try {
    const cookieStore = await cookies();

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError || !sessionData.user) {
      console.error("Code exchange failed:", sessionError);
      return NextResponse.redirect(`${BASE_URL}/login?error=auth_failed`);
    }

    const userId = sessionData.user.id;
    const userEmail = sessionData.user.email ?? "";

    const { data: host } = await supabase
      .from("hosts")
      .select("id, onboarding_complete")
      .eq("id", userId)
      .maybeSingle();

    if (!host) {
      const { error: insertError } = await supabase.from("hosts").insert({
        id: userId,
        email: userEmail,
        name: userEmail.split("@")[0],
        onboarding_complete: false,
      });
      if (insertError) {
        console.error("Host row creation failed:", insertError);
      }
      return NextResponse.redirect(`${BASE_URL}/onboarding`);
    }

    if (!host.onboarding_complete) {
      return NextResponse.redirect(`${BASE_URL}/onboarding`);
    }

    return NextResponse.redirect(`${BASE_URL}/dashboard`);
  } catch (err) {
    console.error("Auth callback error:", err);
    return NextResponse.redirect(`${BASE_URL}/login?error=auth_failed`);
  }
}
