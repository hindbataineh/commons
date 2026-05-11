"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Signing you in...");

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error || !session) {
        setStatus("Sign in failed. Redirecting...");
        setTimeout(() => router.push("/login?error=auth_failed"), 1500);
        return;
      }

      const { data: host } = await supabase
        .from("hosts")
        .select("id, onboarding_complete")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!host) {
        await fetch("/api/create-host", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: session.user.id,
            email: session.user.email,
          }),
        });
        router.push("/onboarding");
        return;
      }

      router.push(host.onboarding_complete ? "/dashboard" : "/onboarding");
    };

    handleCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-off-white">
      <p className="text-muted text-sm">{status}</p>
    </div>
  );
}
