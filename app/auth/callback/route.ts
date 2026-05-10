import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=no_code`);
  }

  const response = NextResponse.redirect(`${origin}/onboarding`);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !session) {
    console.error("Auth callback error:", error);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  const svc = createServiceClient();
  const { data: host } = await svc
    .from("hosts")
    .select("id, onboarding_complete")
    .eq("id", session.user.id)
    .maybeSingle();

  if (!host) {
    await svc.from("hosts").insert({
      id: session.user.id,
      email: session.user.email!,
      name: session.user.email!.split("@")[0],
    });
    response.headers.set("location", `${origin}/onboarding`);
    return response;
  }

  const destination = host.onboarding_complete ? "/dashboard" : "/onboarding";
  response.headers.set("location", `${origin}${destination}`);
  return response;
}
