import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL!;

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/login`);
  }

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

  const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !sessionData.user) {
    return NextResponse.redirect(`${baseUrl}/login`);
  }

  const userId = sessionData.user.id;
  const userEmail = sessionData.user.email ?? "";

  // Check if host row exists
  const { data: host } = await supabase
    .from("hosts")
    .select("id, onboarding_complete")
    .eq("id", userId)
    .single();

  if (!host) {
    // Create host row with auth UUID as id
    await supabase.from("hosts").insert({
      id: userId,
      email: userEmail,
      name: userEmail.split("@")[0],
      onboarding_complete: false,
    });
    return NextResponse.redirect(`${baseUrl}/onboarding`);
  }

  if (!host.onboarding_complete) {
    return NextResponse.redirect(`${baseUrl}/onboarding`);
  }

  return NextResponse.redirect(`${baseUrl}/dashboard`);
}
