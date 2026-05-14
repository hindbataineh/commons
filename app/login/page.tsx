"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: "https://commons-khaki.vercel.app/auth/callback",
      },
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      {/* Left — brand panel */}
      <div className="bg-charcoal flex flex-col justify-between px-10 py-12 md:w-1/2 md:min-h-screen">
        <div>
          <span className="font-display text-2xl text-cream">Commons</span>
        </div>

        <div className="mt-16 md:mt-0">
          <h1 className="font-display text-4xl md:text-5xl font-medium text-cream leading-tight mb-5">
            Run your community<br className="hidden md:block" /> in one dashboard
          </h1>
          <p className="text-sand/80 text-base leading-relaxed mb-10 max-w-sm">
            Bookings, members, payments and insights — everything you need to manage and grow your community in one place.
          </p>
          <ul className="flex flex-col gap-4">
            {[
              "Shareable booking links in seconds",
              "Know your members, not just attendees",
              "Built for how you run communities",
            ].map((point) => (
              <li key={point} className="flex items-start gap-3">
                <span className="mt-0.5 w-5 h-5 rounded-full bg-terracotta/20 flex items-center justify-center shrink-0">
                  <svg className="w-3 h-3 text-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="text-sand/80 text-sm">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-12 md:mt-0">
          <p className="text-muted text-xs">© {new Date().getFullYear()} Commons</p>
        </div>
      </div>

      {/* Right — auth panel */}
      <div className="bg-cream flex items-center justify-center px-8 py-14 md:w-1/2 md:min-h-screen">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold text-charcoal mb-1">Get started</h2>
          <p className="text-sm text-muted mb-8">Sign in or create your account with a magic link.</p>

          {submitted ? (
            <div className="bg-white border border-sand rounded-xl p-6">
              <div className="w-10 h-10 rounded-full bg-terracotta/10 flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-charcoal font-medium mb-1">Check your email</p>
              <p className="text-muted text-sm">
                We sent a magic link to <span className="text-charcoal font-medium">{email}</span>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-charcoal" htmlFor="email">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  required
                  autoComplete="email"
                  className="w-full rounded-lg border border-sand bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-muted/50 focus:outline-none focus:border-charcoal focus:ring-1 focus:ring-charcoal/20 transition-colors"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-charcoal text-cream rounded-lg px-5 py-3 text-sm font-medium hover:bg-charcoal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Sending…" : "Send magic link"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
