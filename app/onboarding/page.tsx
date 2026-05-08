"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Step = 1 | 2 | 3;
type RepeatOption = "one-off" | "weekly" | "biweekly";

interface CommunityForm {
  name: string;
  slug: string;
  type: string;
  location: string;
  description: string;
  instagram_handle: string;
}

interface EventForm {
  name: string;
  date: string;
  time: string;
  location: string;
  priceAed: string;
  capacity: string;
  repeat: RepeatOption;
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const COMMUNITY_TYPES = [
  { value: "run_club", label: "Run Club" },
  { value: "fitness", label: "Fitness" },
  { value: "yoga", label: "Yoga" },
  { value: "creative", label: "Creative" },
  { value: "social", label: "Social" },
  { value: "sports", label: "Sports" },
  { value: "other", label: "Other" },
];

const baseInput =
  "w-full rounded-lg border border-sand bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-muted/50 focus:outline-none focus:border-charcoal focus:ring-1 focus:ring-charcoal/20 transition-colors";
const baseLabel = "text-sm font-medium text-charcoal";

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [community, setCommunity] = useState<CommunityForm>({
    name: "",
    slug: "",
    type: "run_club",
    location: "",
    description: "",
    instagram_handle: "",
  });

  const [event, setEvent] = useState<EventForm>({
    name: "",
    date: "",
    time: "",
    location: "",
    priceAed: "0",
    capacity: "20",
    repeat: "one-off",
  });

  function handleCommunityNameChange(name: string) {
    setCommunity((prev) => ({ ...prev, name, slug: generateSlug(name) }));
  }

  async function handleLaunch() {
    setLoading(true);
    setError("");

    try {
      const supabase = createClient();

      console.log("[onboarding] getting user session...");
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError) {
        console.error("[onboarding] getUser error:", userError);
      }

      if (!user) {
        console.error("[onboarding] no user — session likely expired");
        router.push("/login?error=session_expired");
        return;
      }

      console.log("[onboarding] user id:", user.id);

      const priceFilsRaw = Math.round(parseFloat(event.priceAed || "0") * 100);
      const priceFils = isNaN(priceFilsRaw) ? 0 : priceFilsRaw;

      console.log("[onboarding] inserting community...", community.slug);
      const { data: newCommunity, error: communityError } = await supabase
        .from("communities")
        .insert({
          host_id: user.id,
          name: community.name,
          slug: community.slug,
          type: community.type,
          location: community.location,
          description: community.description || null,
          instagram_handle: community.instagram_handle || null,
        })
        .select("id")
        .single();

      if (communityError) {
        console.error("[onboarding] community insert error:", communityError);
        setError(
          communityError.message.includes("unique")
            ? `The URL "${community.slug}" is already taken. Edit it above.`
            : `Community error: ${communityError.message} (code: ${communityError.code})`
        );
        setLoading(false);
        setStep(1);
        return;
      }

      console.log("[onboarding] community created:", newCommunity.id);
      console.log("[onboarding] inserting event...", event.name);

      const { error: eventError } = await supabase.from("events").insert({
        community_id: newCommunity.id,
        name: event.name,
        slug: generateSlug(event.name),
        location: event.location || community.location,
        event_date: event.date,
        event_time: event.time,
        price: priceFils,
        currency: "AED",
        capacity: parseInt(event.capacity, 10),
        is_recurring: event.repeat !== "one-off",
        recurrence_rule: event.repeat === "one-off" ? null : event.repeat,
        status: "active",
      });

      if (eventError) {
        console.error("[onboarding] event insert error:", eventError);
        setError(`Event error: ${eventError.message} (code: ${eventError.code})`);
        setLoading(false);
        return;
      }

      console.log("[onboarding] event created, marking onboarding complete...");
      const { error: hostUpdateError } = await supabase
        .from("hosts")
        .update({ onboarding_complete: true })
        .eq("id", user.id);

      if (hostUpdateError) {
        console.error("[onboarding] host update error:", hostUpdateError);
      }

      console.log("[onboarding] done, redirecting to dashboard");
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("[onboarding] unexpected error:", err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  const priceNum = parseFloat(event.priceAed || "0");
  const isFree = isNaN(priceNum) || priceNum === 0;

  return (
    <main className="min-h-screen bg-cream px-4 py-12">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-10">
          <span className="font-display text-2xl text-charcoal">Commons</span>
          <p className="text-sm text-muted mt-1">Let&rsquo;s set up your community.</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-10">
          {([1, 2, 3] as Step[]).map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  step === s
                    ? "bg-charcoal text-cream"
                    : step > s
                    ? "bg-terracotta text-white"
                    : "bg-sand text-muted"
                }`}
              >
                {step > s ? (
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  s
                )}
              </div>
              {s < 3 && <div className={`h-px w-8 ${step > s ? "bg-terracotta" : "bg-sand"}`} />}
            </div>
          ))}
          <span className="text-xs text-muted ml-2">
            {step === 1 ? "Community" : step === 2 ? "First event" : "Review"}
          </span>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* ── Step 1 ── */}
        {step === 1 && (
          <div className="flex flex-col gap-5">
            <h2 className="font-display text-3xl font-medium text-charcoal">Your community</h2>

            <div className="flex flex-col gap-1.5">
              <label className={baseLabel}>Community name</label>
              <input
                className={baseInput}
                placeholder="Kite Beach Run Club"
                value={community.name}
                onChange={(e) => handleCommunityNameChange(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={baseLabel}>Type</label>
              <select
                className={baseInput}
                value={community.type}
                onChange={(e) => setCommunity((p) => ({ ...p, type: e.target.value }))}
              >
                {COMMUNITY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={baseLabel}>Location</label>
              <input
                className={baseInput}
                placeholder="Kite Beach, Dubai"
                value={community.location}
                onChange={(e) => setCommunity((p) => ({ ...p, location: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={baseLabel}>
                Description <span className="text-muted font-normal">(optional)</span>
              </label>
              <textarea
                className={`${baseInput} resize-none`}
                rows={3}
                placeholder="Tell people what your community is about…"
                value={community.description}
                onChange={(e) => setCommunity((p) => ({ ...p, description: e.target.value }))}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={baseLabel}>
                Instagram <span className="text-muted font-normal">(optional)</span>
              </label>
              <input
                className={baseInput}
                placeholder="@yourhandle"
                value={community.instagram_handle}
                onChange={(e) => setCommunity((p) => ({ ...p, instagram_handle: e.target.value }))}
              />
            </div>

            {/* Slug preview */}
            {community.slug && (
              <div className="bg-charcoal/5 rounded-lg px-4 py-3">
                <p className="text-xs text-muted mb-1">Your booking URL</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-charcoal font-medium">
                    commons.ae/<span className="text-terracotta">{community.slug}</span>
                  </p>
                </div>
                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-xs text-muted">Edit URL</label>
                  <input
                    className="text-sm border border-sand rounded-md px-2 py-1 bg-white text-charcoal focus:outline-none focus:border-charcoal"
                    value={community.slug}
                    onChange={(e) => setCommunity((p) => ({ ...p, slug: e.target.value }))}
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => {
                if (!community.name || !community.location || !community.slug) {
                  setError("Please fill in name, type, and location.");
                  return;
                }
                setError("");
                setStep(2);
              }}
              className="w-full bg-charcoal text-cream rounded-lg px-5 py-3 text-sm font-medium hover:bg-charcoal/90 transition-colors mt-2"
            >
              Next — add your first event
            </button>
          </div>
        )}

        {/* ── Step 2 ── */}
        {step === 2 && (
          <div className="flex flex-col gap-5">
            <h2 className="font-display text-3xl font-medium text-charcoal">First event</h2>

            <div className="flex flex-col gap-1.5">
              <label className={baseLabel}>Event name</label>
              <input
                className={baseInput}
                placeholder="Saturday Morning Run"
                value={event.name}
                onChange={(e) => setEvent((p) => ({ ...p, name: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={baseLabel}>Date</label>
                <input
                  type="date"
                  className={baseInput}
                  value={event.date}
                  onChange={(e) => setEvent((p) => ({ ...p, date: e.target.value }))}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={baseLabel}>Time</label>
                <input
                  type="time"
                  className={baseInput}
                  value={event.time}
                  onChange={(e) => setEvent((p) => ({ ...p, time: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={baseLabel}>Location</label>
              <input
                className={baseInput}
                value={event.location || community.location}
                onChange={(e) => setEvent((p) => ({ ...p, location: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5">
                <label className={baseLabel}>Price (AED)</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="1"
                    className={baseInput}
                    placeholder="0"
                    value={event.priceAed}
                    onChange={(e) => setEvent((p) => ({ ...p, priceAed: e.target.value }))}
                  />
                  {isFree && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-charcoal bg-sand px-1.5 py-0.5 rounded">
                      FREE
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className={baseLabel}>Capacity</label>
                <input
                  type="number"
                  min="1"
                  className={baseInput}
                  value={event.capacity}
                  onChange={(e) => setEvent((p) => ({ ...p, capacity: e.target.value }))}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className={baseLabel}>Repeats</label>
              <select
                className={baseInput}
                value={event.repeat}
                onChange={(e) => setEvent((p) => ({ ...p, repeat: e.target.value as RepeatOption }))}
              >
                <option value="one-off">One-off</option>
                <option value="weekly">Weekly</option>
                <option value="biweekly">Every two weeks</option>
              </select>
            </div>

            <div className="flex gap-3 mt-2">
              <button
                onClick={() => { setError(""); setStep(1); }}
                className="flex-1 bg-cream border border-sand text-charcoal rounded-lg px-5 py-3 text-sm font-medium hover:bg-sand/40 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (!event.name || !event.date || !event.time) {
                    setError("Please fill in event name, date, and time.");
                    return;
                  }
                  if (!event.location && !community.location) {
                    setError("Please enter a location.");
                    return;
                  }
                  if (!event.location) setEvent((p) => ({ ...p, location: community.location }));
                  setError("");
                  setStep(3);
                }}
                className="flex-1 bg-charcoal text-cream rounded-lg px-5 py-3 text-sm font-medium hover:bg-charcoal/90 transition-colors"
              >
                Review
              </button>
            </div>
          </div>
        )}

        {/* ── Step 3 ── */}
        {step === 3 && (
          <div className="flex flex-col gap-6">
            <h2 className="font-display text-3xl font-medium text-charcoal">Ready to launch?</h2>

            <div className="bg-white border border-sand rounded-xl p-5 flex flex-col gap-4">
              <div>
                <p className="text-xs text-muted uppercase tracking-wide mb-1">Community</p>
                <p className="font-medium text-charcoal">{community.name}</p>
                <p className="text-sm text-muted">commons.ae/{community.slug}</p>
              </div>
              <div className="border-t border-sand pt-4">
                <p className="text-xs text-muted uppercase tracking-wide mb-1">First event</p>
                <p className="font-medium text-charcoal">{event.name}</p>
                <p className="text-sm text-muted">
                  {event.date} at {event.time}
                </p>
                <p className="text-sm text-muted">{event.location || community.location}</p>
                <p className="text-sm text-muted">
                  {isFree ? "Free" : `AED ${event.priceAed}`} · {event.capacity} spots ·{" "}
                  {event.repeat === "one-off" ? "One-off" : event.repeat === "weekly" ? "Weekly" : "Biweekly"}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setError(""); setStep(2); }}
                className="flex-1 bg-cream border border-sand text-charcoal rounded-lg px-5 py-3 text-sm font-medium hover:bg-sand/40 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleLaunch}
                disabled={loading}
                className="flex-1 bg-terracotta text-white rounded-lg px-5 py-3 text-sm font-medium hover:bg-terracotta/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Launching…" : "Launch my community"}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
