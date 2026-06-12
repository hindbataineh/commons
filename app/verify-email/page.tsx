"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function VerifyEmailPage() {
  const [email, setEmail] = useState("");
  const [resent, setResent] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("signup_email") ?? "";
    setEmail(stored);
  }, []);

  async function handleResend() {
    if (!email) return;
    setResending(true);
    const supabase = createClient();
    await supabase.auth.resend({ type: "signup", email });
    setResending(false);
    setResent(true);
    setTimeout(() => setResent(false), 4000);
  }

  return (
    <main className="min-h-screen bg-off-white flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <div className="w-16 h-16 rounded-full bg-charcoal flex items-center justify-center mx-auto mb-8">
          <svg className="w-8 h-8 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
        </div>

        <h1 className="font-display text-4xl font-medium text-charcoal mb-3">Check your email</h1>

        <p className="text-muted text-sm leading-relaxed mb-8">
          We&rsquo;ve sent a verification link to{" "}
          {email ? <span className="text-charcoal font-medium">{email}</span> : "your email address"}.
          {" "}Click the link to activate your Commons account.
        </p>

        <button
          onClick={handleResend}
          disabled={resending}
          className="w-full bg-charcoal text-cream rounded-lg px-5 py-3 text-sm font-medium hover:bg-charcoal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {resending ? "Sending…" : resent ? "Sent!" : "Resend email"}
        </button>

        <p className="text-xs text-muted">
          Wrong email?{" "}
          <Link href="/signup" className="text-charcoal underline hover:text-terracotta transition-colors">
            Start over
          </Link>
        </p>
      </div>
    </main>
  );
}
