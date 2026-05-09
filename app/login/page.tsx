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
    <main className="min-h-screen bg-charcoal flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-4xl font-medium text-cream mb-2">
          Commons
        </h1>
        <p className="text-muted text-sm mb-10">Host dashboard</p>

        {submitted ? (
          <div className="bg-charcoal border border-sand/30 rounded-xl p-6">
            <div className="w-10 h-10 rounded-full bg-terracotta/20 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-terracotta" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-cream font-medium mb-1">Check your email</p>
            <p className="text-muted text-sm">
              We sent a magic link to <span className="text-sand">{email}</span>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-sand" htmlFor="email">
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
                className="w-full rounded-lg border border-sand/30 bg-white/5 px-4 py-2.5 text-sm text-cream placeholder:text-muted/50 focus:outline-none focus:border-sand transition-colors"
              />
            </div>

            {error && (
              <p className="text-sm text-red-400">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-terracotta text-white rounded-lg px-5 py-3 text-sm font-medium hover:bg-terracotta/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Sending…" : "Send magic link"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
