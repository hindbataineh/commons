import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import type { ResponseCookie } from "next/dist/compiled/@edge-runtime/cookies";

const BASE_URL = "https://commons-khaki.vercel.app";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${BASE_URL}/login?error=auth_failed`);
  }

  try {
    // Buffer cookies so we can attach them to the redirect response
    const cookieBuffer: Array<{ name: string; value: string; options: Partial<ResponseCookie> }> = [];

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieBuffer.push({ name, value, options })
            );
          },
        },
      }
    );

    const { data: sessionData, error: sessionError } =
      await supabase.auth.exchangeCodeForSession(code);

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
      const res = NextResponse.redirect(`${BASE_URL}/onboarding`);
      cookieBuffer.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
      return res;
    }

    const destination = host.onboarding_complete ? `${BASE_URL}/dashboard` : `${BASE_URL}/onboarding`;
    const res = NextResponse.redirect(destination);
    cookieBuffer.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
    return res;
  } catch (err) {
    console.error("Auth callback error:", err);
    return NextResponse.redirect(`${BASE_URL}/login?error=auth_failed`);
  }
}
