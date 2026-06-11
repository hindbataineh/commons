"use client";

import { useEffect, useState } from "react";

const COMMUNITY_TYPES = [
  { value: "run_club", label: "Run club" },
  { value: "fitness", label: "Fitness & gym" },
  { value: "yoga", label: "Yoga" },
  { value: "pilates", label: "Pilates" },
  { value: "wellness", label: "Wellness" },
  { value: "tennis", label: "Tennis" },
  { value: "padel", label: "Padel" },
  { value: "ladies_only", label: "Ladies only" },
  { value: "creative", label: "Creative workshop" },
  { value: "social", label: "Social club" },
  { value: "sports", label: "Sports" },
  { value: "other", label: "Other" },
];

function generateSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

const baseInput =
  "w-full rounded-lg border border-sand bg-white px-4 py-2.5 text-sm text-charcoal placeholder:text-muted/50 focus:outline-none focus:border-charcoal focus:ring-1 focus:ring-charcoal/20 transition-colors";
const baseLabel = "text-sm font-medium text-charcoal";

export default function CompleteProfilePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pendingUserId, setPendingUserId] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState("run_club");
  const [customType, setCustomType] = useState("");
  const [location, setLocation] = useState("");
  const [instagram, setInstagram] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const uid = params.get("uid");
    const email = params.get("email");

    console.log("[profile] uid from params:", uid);
    console.log("[profile] email from params:", email);

    if (!uid || !email) {
      console.log("[profile] no session data found, redirecting to signup");
      window.location.href = "/signup";
      return;
    }

    setPendingUserId(uid);
    setPendingEmail(email);
  }, []);

  function handleNameChange(val: string) {
    setName(val);
    setSlug(generateSlug(val));
  }

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    console.log("[profile] handleSubmit called", { pendingUserId, pendingEmail });
    setError("");

    if (!name || !location || !slug) {
      setError("Please fill in name and location.");
      return;
    }
    if (description.length < 50) {
      setError("Please write at least 50 characters in the description.");
      return;
    }
    if (!instagram) {
      setError("Please enter your Instagram handle.");
      return;
    }
    if (type === "other" && !customType) {
      setError("Please describe your community type.");
      return;
    }

    setLoading(true);

    // Normalise website: prepend https:// if no protocol present
    let normalisedWebsite = website.trim();
    if (normalisedWebsite && !/^https?:\/\//i.test(normalisedWebsite)) {
      normalisedWebsite = "https://" + normalisedWebsite;
    }

    const res = await fetch("/api/setup-community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: pendingUserId,
        email: pendingEmail,
        name,
        slug,
        type,
        custom_type: customType,
        location,
        description,
        instagram_handle: instagram,
        website: normalisedWebsite,
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    // Store email for /verify-email display, then navigate
    sessionStorage.setItem("signup_email", pendingEmail);
    window.location.href = "/verify-email";
  }

  return (
    <main className="min-h-screen bg-cream px-4 py-12">
      <div className="max-w-lg mx-auto">
        <div className="mb-10">
          <span className="font-display text-2xl text-charcoal">Commons</span>
          <p className="text-sm text-muted mt-1">Tell us about your community.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className={baseLabel}>Club / community name</label>
            <input
              className={baseInput}
              placeholder="Kite Beach Run Club"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={baseLabel}>Type of community</label>
            <select
              className={baseInput}
              value={type}
              onChange={(e) => { setType(e.target.value); setCustomType(""); }}
            >
              {COMMUNITY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            {type === "other" && (
              <input
                className={baseInput}
                placeholder="e.g. Cycling club"
                value={customType}
                onChange={(e) => setCustomType(e.target.value)}
              />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={baseLabel}>Location</label>
            <input
              className={baseInput}
              placeholder="Dubai, UAE"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={baseLabel}>Instagram handle</label>
            <input
              className={baseInput}
              placeholder="@yourcommunity"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={baseLabel}>
              Website <span className="text-muted font-normal">(optional)</span>
            </label>
            <input
              type="text"
              className={baseInput}
              placeholder="www.yourwebsite.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className={baseLabel}>Description</label>
            <textarea
              className={`${baseInput} resize-none`}
              rows={3}
              maxLength={300}
              placeholder="Tell people what your community is about…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <p className={`text-xs text-right ${description.length < 50 || description.length > 300 ? "text-red-500" : "text-muted"}`}>
              {description.length} / 300 characters
            </p>
          </div>

          {/* Slug preview */}
          {slug && (
            <div className="bg-charcoal/5 rounded-lg px-4 py-3">
              <p className="text-xs text-muted mb-1">Your booking URL</p>
              <p className="text-sm text-charcoal font-medium">
                commons.ae/<span className="text-terracotta">{slug}</span>
              </p>
              <div className="flex flex-col gap-1 mt-2">
                <label className="text-xs text-muted">Edit URL</label>
                <input
                  className="text-sm border border-sand rounded-md px-2 py-1 bg-white text-charcoal focus:outline-none focus:border-charcoal"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => { console.log("[profile] button clicked"); handleSubmit(); }}
            disabled={loading}
            className="w-full bg-charcoal text-cream rounded-lg px-5 py-3 text-sm font-medium hover:bg-charcoal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Creating your community…" : "Create my community"}
          </button>
        </form>
      </div>
    </main>
  );
}
